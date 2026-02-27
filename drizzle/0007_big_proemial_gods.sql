CREATE TYPE "public"."attachment_owner_type" AS ENUM('task', 'priority');--> statement-breakpoint
CREATE TYPE "public"."attachment_type" AS ENUM('link', 'image', 'file');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"owner_type" "attachment_owner_type" NOT NULL,
	"owner_id" uuid NOT NULL,
	"type" "attachment_type" NOT NULL,
	"title" text,
	"note" text,
	"position" integer DEFAULT 0 NOT NULL,
	"url" text,
	"domain" text,
	"description" text,
	"preview_image_url" text,
	"fetched_at" timestamp,
	"storage_key" text,
	"mime_type" text,
	"byte_size" bigint,
	"width" integer,
	"height" integer,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_user_id_idx" ON "attachments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attachments_owner_idx" ON "attachments" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "attachments_owner_position_idx" ON "attachments" USING btree ("owner_type","owner_id","position");--> statement-breakpoint
CREATE INDEX "attachments_owner_active_idx" ON "attachments" USING btree ("owner_type","owner_id") WHERE "attachments"."deleted_at" is null;