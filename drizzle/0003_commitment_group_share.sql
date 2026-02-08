CREATE TYPE "public"."share_permission" AS ENUM('view', 'edit');--> statement-breakpoint
CREATE TABLE "commitment_group_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"shared_with_user_id" text NOT NULL,
	"permission" "share_permission" DEFAULT 'view' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD CONSTRAINT "commitment_group_shares_group_id_commitment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."commitment_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD CONSTRAINT "commitment_group_shares_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commitment_group_shares_group_id_idx" ON "commitment_group_shares" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "commitment_group_shares_shared_with_user_id_idx" ON "commitment_group_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commitment_group_shares_group_id_shared_with_user_id_idx" ON "commitment_group_shares" USING btree ("group_id","shared_with_user_id");