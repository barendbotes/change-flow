ALTER TABLE "change_requests" ALTER COLUMN "attachments" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "change_requests" ALTER COLUMN "attachments" SET DEFAULT '[]';