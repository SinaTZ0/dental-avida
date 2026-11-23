CREATE TABLE "campaign_ad_channel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"campaign_slug" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"platform_type" text DEFAULT 'local_site' NOT NULL,
	"placement" text DEFAULT 'banner' NOT NULL,
	"budget_toman" integer DEFAULT 0 NOT NULL,
	"spent_toman" integer DEFAULT 0 NOT NULL,
	"schedule_text" text DEFAULT '' NOT NULL,
	"approval_status" text DEFAULT 'pending_approval' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_discount" ADD COLUMN "base_price_toman" integer;--> statement-breakpoint
ALTER TABLE "campaign_lead" ADD COLUMN "crm_sync_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_lead" ADD COLUMN "crm_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaign_lead" ADD COLUMN "crm_last_error" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_setting" ADD COLUMN "crm_webhook_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_setting" ADD COLUMN "crm_webhook_secret" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_ad_channel_slug_code_idx" ON "campaign_ad_channel" ("campaign_slug","code");--> statement-breakpoint
CREATE INDEX "campaign_ad_channel_slug_created_idx" ON "campaign_ad_channel" ("campaign_slug","created_at");--> statement-breakpoint
ALTER TABLE "campaign_ad_channel" ADD CONSTRAINT "campaign_ad_channel_campaign_slug_campaign_setting_slug_fkey" FOREIGN KEY ("campaign_slug") REFERENCES "campaign_setting"("slug") ON DELETE CASCADE;