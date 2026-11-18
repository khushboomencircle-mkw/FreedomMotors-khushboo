ALTER TABLE "vehicle_images" ALTER COLUMN "storage_path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "content_type" text;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "byte_size" integer;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD COLUMN "downloaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "date_in_stock" date;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "selling_price_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "msrp_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "book_value_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "invoice_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "internet_price_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "misc_price_1_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "misc_price_2_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "misc_price_3_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "dealer_address" text;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "dealer_city" text;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "dealer_state" text;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "dealer_zip" text;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "dealer_phone" text;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "dealer_fax" text;--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD COLUMN "dealer_email" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "stock_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "model_number" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "doors" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "style_description" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "market_class" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "passenger_capacity" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "factory_codes" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "ext_color_generic" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "ext_color_code" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "ext_color_hex" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "int_color_generic" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "int_color_code" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "int_color_hex" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "interior_upholstery" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_cylinders" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_displacement" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_displacement_cubic_inches" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_block_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_aspiration_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transmission_speed" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transmission_description" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "city_mpg" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "highway_mpg" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "epa_classification" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "wheelbase_code" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "certified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "options" text[];--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "categorized_options" jsonb;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "conversion_warranty" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_1" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_2" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_3" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_4" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_5" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_6" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_7" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_8" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "comment_9" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "feed_checksum" text;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_images_vehicle_source_url_idx" ON "vehicle_images" USING btree ("vehicle_id","source_url") WHERE "vehicle_images"."source_url" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_images_storage_path_idx" ON "vehicle_images" USING btree ("storage_path") WHERE "vehicle_images"."storage_path" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "vehicle_inventory_status_price_idx" ON "vehicle_inventory" USING btree ("status","selling_price_cents");--> statement-breakpoint
CREATE INDEX "vehicles_make_model_idx" ON "vehicles" USING btree ("make","model");--> statement-breakpoint
CREATE INDEX "vehicles_year_idx" ON "vehicles" USING btree ("year");--> statement-breakpoint
CREATE INDEX "vehicles_stock_type_idx" ON "vehicles" USING btree ("stock_type");--> statement-breakpoint
CREATE INDEX "vehicles_body_style_idx" ON "vehicles" USING btree ("body_style");--> statement-breakpoint
ALTER TABLE "vehicle_inventory" DROP COLUMN "price_cents";--> statement-breakpoint
ALTER TABLE "vehicle_inventory" DROP COLUMN "dealer_location";--> statement-breakpoint
-- ── Repair existing photo rows before the new rules are added ──
-- The old schema allowed a stored path without a checksum. A content-addressed path (vehicles/<vehicle id>/<sha256>.<ext>) already
-- contains the hash of the file, so it becomes the checksum.
UPDATE "vehicle_images" SET "checksum" = substring("storage_path" from '/([0-9a-f]{64})\.(jpg|png|webp)$')
  WHERE "checksum" IS NULL AND "storage_path" ~ '^vehicles/[0-9a-f-]{36}/[0-9a-f]{64}\.(jpg|png|webp)$';--> statement-breakpoint
-- A path that is not in the one valid shape (or belongs to another vehicle) cannot be served: send that photo back to be downloaded again.
UPDATE "vehicle_images" SET "storage_path" = NULL, "checksum" = NULL, "status" = 'pending'
  WHERE "storage_path" IS NOT NULL
    AND ("checksum" IS NULL OR "storage_path" !~ ('^vehicles/' || "vehicle_id"::text || '/' || "checksum" || '\.(jpg|png|webp)$'));--> statement-breakpoint
-- Anything still marked ready without a file goes back to pending.
UPDATE "vehicle_images" SET "status" = 'pending' WHERE "status" = 'ready' AND ("storage_path" IS NULL OR "checksum" IS NULL);--> statement-breakpoint
-- A checksum that is not a lowercase SHA-256 is cleared.
UPDATE "vehicle_images" SET "checksum" = NULL WHERE "checksum" IS NOT NULL AND "checksum" !~ '^[0-9a-f]{64}$' AND "storage_path" IS NULL;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_sort_order_not_negative" CHECK ("vehicle_images"."sort_order" >= 0);--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_checksum_format" CHECK ("vehicle_images"."checksum" IS NULL OR "vehicle_images"."checksum" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_ready_has_file" CHECK ("vehicle_images"."status" <> 'ready' OR ("vehicle_images"."storage_path" IS NOT NULL AND "vehicle_images"."checksum" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_storage_path_shape" CHECK ("vehicle_images"."storage_path" IS NULL OR (
        "vehicle_images"."checksum" IS NOT NULL
        AND "vehicle_images"."storage_path" ~ ('^vehicles/' || "vehicle_images"."vehicle_id"::text || '/' || "vehicle_images"."checksum" || '\.(jpg|png|webp)$')
      ));--> statement-breakpoint
ALTER TABLE "vehicle_inventory" ADD CONSTRAINT "vehicle_inventory_prices_not_negative" CHECK (COALESCE("vehicle_inventory"."selling_price_cents", 0) >= 0
        AND COALESCE("vehicle_inventory"."msrp_cents", 0) >= 0
        AND COALESCE("vehicle_inventory"."book_value_cents", 0) >= 0
        AND COALESCE("vehicle_inventory"."invoice_cents", 0) >= 0
        AND COALESCE("vehicle_inventory"."internet_price_cents", 0) >= 0
        AND COALESCE("vehicle_inventory"."misc_price_1_cents", 0) >= 0
        AND COALESCE("vehicle_inventory"."misc_price_2_cents", 0) >= 0
        AND COALESCE("vehicle_inventory"."misc_price_3_cents", 0) >= 0);--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_has_identity" CHECK ("vehicles"."vin" IS NOT NULL OR "vehicles"."stock_number" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_year_range" CHECK ("vehicles"."year" IS NULL OR "vehicles"."year" BETWEEN 1900 AND 2100);--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_mileage_not_negative" CHECK ("vehicles"."mileage" IS NULL OR "vehicles"."mileage" >= 0);--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_ext_color_hex_format" CHECK ("vehicles"."ext_color_hex" IS NULL OR "vehicles"."ext_color_hex" ~ '^[0-9A-Fa-f]{6}$');--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_int_color_hex_format" CHECK ("vehicles"."int_color_hex" IS NULL OR "vehicles"."int_color_hex" ~ '^[0-9A-Fa-f]{6}$');