CREATE TABLE "review_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"pathname" text NOT NULL,
	"viewport" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"comment" text NOT NULL,
	"author_name" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "review_feedback_path_viewport_idx" ON "review_feedback" ("pathname","viewport","created_at");--> statement-breakpoint
CREATE INDEX "review_feedback_status_idx" ON "review_feedback" ("status","created_at");