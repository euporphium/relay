CREATE TYPE "public"."commitment_state" AS ENUM('active', 'fulfilled', 'released');--> statement-breakpoint
CREATE TABLE "commitment_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"group_id" uuid,
	"title" text NOT NULL,
	"note" text,
	"state" "commitment_state" DEFAULT 'active' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commitment_groups" ADD CONSTRAINT "commitment_groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitments" ADD CONSTRAINT "commitments_group_id_commitment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."commitment_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commitment_groups_user_id_idx" ON "commitment_groups" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commitment_groups_user_id_name_idx" ON "commitment_groups" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "commitments_user_id_idx" ON "commitments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "commitments_group_id_idx" ON "commitments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "commitments_group_order_idx" ON "commitments" USING btree ("user_id","group_id","position");