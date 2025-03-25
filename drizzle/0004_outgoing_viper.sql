DROP TABLE "change_request_approvals" CASCADE;--> statement-breakpoint
DROP TABLE "change_requests" CASCADE;--> statement-breakpoint
ALTER TABLE "file_tokens" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;