ALTER TABLE "attachments" DROP CONSTRAINT "attachments_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "userId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" DROP COLUMN "chat_id";