import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { redis } from "@/lib/upstash";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }

  // Verify user owns the chat
  const [existingChat] = await db
    .select({ userId: chats.userId })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!existingChat || existingChat.userId !== userId) {
    return new Response("Chat not found or unauthorized", { status: 403 });
  }

  const encoder = new TextEncoder();
  let isSubscribed = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial stream state if exists
      const streamState = await redis.get(`stream:${chatId}`);
      if (streamState) {
        try {
          const state = JSON.parse(streamState as string);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              event: "stream_state",
              data: state
            })}

`)
          );
        } catch (parseError) {
          console.error(`[CHAT_STREAM_API] Could not parse existing stream state for chat ${chatId}:`, parseError);
          // If parsing fails, we cannot send the initial stream state, but we don't crash.
        }
      }

      const queueKey = `stream_list:${chatId}`;
      const consumerKey = `consumer:${chatId}:${Date.now()}`;

      // Poll for new messages using Redis lists (simpler approach)
      const pollMessages = async () => {
        while (isSubscribed) {
          try {
            // Use BRPOP for blocking pop (more efficient than polling)
            // Note: Upstash might not support blocking operations, so we'll use regular pop
            const message = await redis.lpop(queueKey);
            
            if (message) {
              try {
                const event = JSON.parse(message as string);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                );
                
                // Close connection after end event
                if (event.event === "end" || event.event === "error") {
                  setTimeout(() => {
                    controller.close();
                  }, 1000);
                  return;
                }
              } catch (parseError) {
                console.error("Error parsing message:", parseError);
              }
            } else {
              // No message, wait a bit before next poll
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error("Error polling messages:", error);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      };

      // Start polling
      pollMessages();

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (!isSubscribed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              event: "heartbeat", 
              data: { timestamp: new Date().toISOString() } 
            })}\n\n`)
          );
        } catch (error) {
          console.error("Heartbeat error:", error);
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup function
      const cleanup = async () => {
        isSubscribed = false;
        clearInterval(heartbeatInterval);
        
        // Clean up any remaining messages in the queue
        try {
          await redis.del(consumerKey);
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      };

      // Handle client disconnect
      req.signal?.addEventListener("abort", cleanup);
      
      // Auto-cleanup after 1 hour
      setTimeout(cleanup, 3600000);
    },
    
    cancel() {
      isSubscribed = false;
      console.log(`[STREAM] Client disconnected from chat: ${chatId}`);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// Helper function to publish messages (use this in your message publisher)
export async function publishStreamEvent(chatId: string, event: any) {
  const queueKey = `stream_list:${chatId}`;
  
  // Push message to the right side of the list (FIFO)
  await redis.rpush(queueKey, JSON.stringify(event));
  
  // Set expiration for the queue (1 hour)
  await redis.expire(queueKey, 3600);
  
  // Keep only last 100 messages
  await redis.ltrim(queueKey, 0, 99);
}