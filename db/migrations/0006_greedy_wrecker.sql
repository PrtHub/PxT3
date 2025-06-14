CREATE TYPE "public"."streaming_status" AS ENUM('streaming', 'completed', 'error', 'interrupted');--> statement-breakpoint
CREATE TABLE "streaming_states" (
	"id" text PRIMARY KEY NOT NULL,
	"chatId" text NOT NULL,
	"messageId" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"status" "streaming_status" DEFAULT 'streaming' NOT NULL,
	"last_chunk_index" integer DEFAULT 0 NOT NULL,
	"total_chunks" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "streaming_states" ADD CONSTRAINT "streaming_states_chatId_chats_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streaming_states" ADD CONSTRAINT "streaming_states_messageId_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;