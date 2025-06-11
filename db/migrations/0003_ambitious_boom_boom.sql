ALTER TABLE "messages" ALTER COLUMN "content" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "content_type" text NOT NULL;