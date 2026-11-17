CREATE TYPE "public"."sync_run_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."vehicle_image_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."vehicle_inventory_status" AS ENUM('available', 'pending', 'sold');--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "sync_run_status" DEFAULT 'running' NOT NULL,
	"vehicles_processed" integer DEFAULT 0 NOT NULL,
	"vehicles_added" integer DEFAULT 0 NOT NULL,
	"vehicles_removed" integer DEFAULT 0 NOT NULL,
	"photos_downloaded" integer DEFAULT 0 NOT NULL,
	"photos_skipped" integer DEFAULT 0 NOT NULL,
	"photos_failed" integer DEFAULT 0 NOT NULL,
	"error_summary" text
);
--> statement-breakpoint
ALTER TABLE "sync_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"status" "vehicle_image_status" DEFAULT 'pending' NOT NULL,
	"checksum" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicle_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"status" "vehicle_inventory_status" DEFAULT 'available' NOT NULL,
	"price_cents" integer,
	"dealer_name" text,
	"dealer_location" text,
	"last_seen_in_feed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin" text,
	"stock_number" text,
	"year" integer,
	"make" text,
	"model" text,
	"trim" text,
	"body_style" text,
	"exterior_color" text,
	"interior_color" text,
	"mileage" integer,
	"transmission" text,
	"drivetrain" text,
	"fuel_type" text,
	"engine" text,
	"raw_feed_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD CONSTRAINT "vehicle_inventory_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_images_vehicle_id_idx" ON "vehicle_images" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_images_status_idx" ON "vehicle_images" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_images_one_main_per_vehicle_idx" ON "vehicle_images" USING btree ("vehicle_id") WHERE "vehicle_images"."is_main" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_inventory_vehicle_id_idx" ON "vehicle_inventory" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_inventory_status_idx" ON "vehicle_inventory" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_vin_idx" ON "vehicles" USING btree ("vin");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_stock_number_idx" ON "vehicles" USING btree ("stock_number");