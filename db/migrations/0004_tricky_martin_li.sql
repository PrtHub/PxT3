ALTER TABLE "attachments" DROP CONSTRAINT "attachments_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "chat_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" DROP COLUMN "userId";