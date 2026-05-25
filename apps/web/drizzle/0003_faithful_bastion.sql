CREATE TABLE IF NOT EXISTS "contact_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_submission_created_idx" ON "contact_submission" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_submission_handled_idx" ON "contact_submission" USING btree ("handled");