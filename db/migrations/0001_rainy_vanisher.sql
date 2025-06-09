ALTER TABLE "user" RENAME COLUMN "email_verified_at" TO "emailVerified";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "email_verified";