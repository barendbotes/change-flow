CREATE TABLE IF NOT EXISTS "file_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"file_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_tokens_token_unique" UNIQUE("token")
);
