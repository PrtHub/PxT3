import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { redis, workflowClient } from "@/lib/upstash";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }

  try {
    const [existingChat] = await db
      .select({ userId: chats.userId })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!existingChat || existingChat.userId !== userId) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 403 });
    }

    const streamState = await redis.get(`stream:${chatId}`);
    const workflowId = await redis.get(`workflow:${chatId}`);

    let workflowStatus: any;
    if (workflowId) {
      try {
        const logResponse = await workflowClient.logs({
          workflowRunId: workflowId as string,
        });
        
        if (logResponse.runs && logResponse.runs.length > 0) {
          const run = logResponse.runs[0];
          workflowStatus = {
            workflowRunId: run.workflowRunId,
            workflowState: run.workflowState,
            workflowRunCreatedAt: run.workflowRunCreatedAt,
            workflowRunCompletedAt: run.workflowRunCompletedAt,
            steps: run.steps,
            failureFunction: run.failureFunction
          };
        }
      } catch (error) {
        console.error("Error getting workflow status:", error);
      }
    }

    return NextResponse.json({
      streamState: streamState ? JSON.parse(streamState as string) : null,
      workflowId,
      workflowStatus,
      hasActiveStream: streamState ? 
        ["starting", "processing", "streaming"].includes(JSON.parse(streamState as string).status) : 
        false,
    });
  } catch (error) {
    console.error("Error getting stream status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }

  try {
    const [existingChat] = await db
      .select({ userId: chats.userId })
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!existingChat || existingChat.userId !== userId) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 403 });
    }

    const workflowId = await redis.get(`workflow:${chatId}`);
    
    if (workflowId) {
      try {
        await workflowClient.cancel({
          ids: [workflowId as string]
        });
        console.log(`[API] Cancelled workflow: ${workflowId}`);
      } catch (error) {
        console.error("Error cancelling workflow:", error);
      }
    }

        await redis.setex(`stream:${chatId}`, 3600, JSON.stringify({
      status: "cancelled",
      chatId,
      cancelledAt: new Date().toISOString(),
    }));

    try {
      await redis.publish(`stream:${chatId}`, JSON.stringify({
        event: "cancelled",
        data: { message: "Stream cancelled by user" },
      }));
    } catch (error) {
      console.error("Error publishing cancellation event:", error);
      const queueKey = `stream_list:${chatId}`;
      await redis.rpush(queueKey, JSON.stringify({
        event: "cancelled",
        data: { message: "Stream cancelled by user" },
      }));
    }

    await redis.del(`workflow:${chatId}`);

    return NextResponse.json({ success: true, message: "Stream cancelled" });
  } catch (error) {
    console.error("Error cancelling stream:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}