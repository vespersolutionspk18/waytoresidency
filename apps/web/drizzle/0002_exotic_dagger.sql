ALTER TABLE "question_topic" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "topic" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "question_topic" CASCADE;--> statement-breakpoint
DROP TABLE "topic" CASCADE;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "subject_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "question" ADD CONSTRAINT "question_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "question_subject_idx" ON "question" USING btree ("subject_id");