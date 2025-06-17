ALTER TABLE "chats" DROP CONSTRAINT "chats_parent_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_branched_from_message_id_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_parent_chat_id_chats_id_fk" FOREIGN KEY ("parent_chat_id") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_branched_from_message_id_messages_id_fk" FOREIGN KEY ("branched_from_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;