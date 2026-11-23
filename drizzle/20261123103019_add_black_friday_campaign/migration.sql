CREATE TABLE "campaign_discount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"campaign_slug" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"cash_percent" integer NOT NULL,
	"installment_percent" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"campaign_slug" text NOT NULL,
	"kind" text NOT NULL,
	"source" text DEFAULT 'direct' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"campaign_slug" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_raw" text NOT NULL,
	"phone_normalized" text NOT NULL,
	"treatment" text NOT NULL,
	"source" text DEFAULT 'direct' NOT NULL,
	"utm_source" text DEFAULT '' NOT NULL,
	"utm_medium" text DEFAULT '' NOT NULL,
	"utm_campaign" text DEFAULT '' NOT NULL,
	"referrer" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_setting" (
	"slug" text PRIMARY KEY,
	"enabled" boolean DEFAULT true NOT NULL,
	"theme_enabled" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"total_capacity" integer DEFAULT 51 NOT NULL,
	"capacity_mode" text DEFAULT 'scheduled' NOT NULL,
	"decrement_interval_minutes" integer DEFAULT 335 NOT NULL,
	"notify_email" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_discount_slug_code_idx" ON "campaign_discount" ("campaign_slug","code");--> statement-breakpoint
CREATE INDEX "campaign_event_slug_kind_created_idx" ON "campaign_event" ("campaign_slug","kind","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_lead_slug_phone_idx" ON "campaign_lead" ("campaign_slug","phone_normalized");--> statement-breakpoint
CREATE INDEX "campaign_lead_slug_created_idx" ON "campaign_lead" ("campaign_slug","created_at");--> statement-breakpoint
CREATE INDEX "campaign_lead_slug_status_idx" ON "campaign_lead" ("campaign_slug","status");--> statement-breakpoint
ALTER TABLE "campaign_discount" ADD CONSTRAINT "campaign_discount_campaign_slug_campaign_setting_slug_fkey" FOREIGN KEY ("campaign_slug") REFERENCES "campaign_setting"("slug") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "campaign_event" ADD CONSTRAINT "campaign_event_campaign_slug_campaign_setting_slug_fkey" FOREIGN KEY ("campaign_slug") REFERENCES "campaign_setting"("slug") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "campaign_lead" ADD CONSTRAINT "campaign_lead_campaign_slug_campaign_setting_slug_fkey" FOREIGN KEY ("campaign_slug") REFERENCES "campaign_setting"("slug") ON DELETE CASCADE;