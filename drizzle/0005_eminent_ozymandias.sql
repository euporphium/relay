ALTER TYPE "public"."commitment_state" RENAME TO "priority_state";--> statement-breakpoint
ALTER TABLE "commitments" RENAME TO "priorities";--> statement-breakpoint
ALTER TABLE "commitment_group_shares" RENAME TO "priority_group_shares";--> statement-breakpoint
ALTER TABLE "commitment_groups" RENAME TO "priority_groups";--> statement-breakpoint
ALTER TABLE "priority_group_shares" DROP CONSTRAINT "commitment_group_shares_group_id_commitment_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "priority_group_shares" DROP CONSTRAINT "commitment_group_shares_invited_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "priority_group_shares" DROP CONSTRAINT "commitment_group_shares_shared_with_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "priority_groups" DROP CONSTRAINT "commitment_groups_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "priorities" DROP CONSTRAINT "commitments_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "priorities" DROP CONSTRAINT "commitments_group_id_commitment_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "priorities" ALTER COLUMN "state" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "priorities" ALTER COLUMN "state" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."priority_state";--> statement-breakpoint
CREATE TYPE "public"."priority_state" AS ENUM('active', 'completed', 'released');--> statement-breakpoint
UPDATE "priorities" SET "state" = 'completed' WHERE "state" = 'fulfilled';--> statement-breakpoint
ALTER TABLE "priorities" ALTER COLUMN "state" SET DEFAULT 'active'::"public"."priority_state";--> statement-breakpoint
ALTER TABLE "priorities" ALTER COLUMN "state" SET DATA TYPE "public"."priority_state" USING "state"::"public"."priority_state";--> statement-breakpoint
DROP INDEX "commitment_group_shares_group_id_idx";--> statement-breakpoint
DROP INDEX "commitment_group_shares_group_id_status_idx";--> statement-breakpoint
DROP INDEX "commitment_group_shares_shared_with_user_id_idx";--> statement-breakpoint
DROP INDEX "commitment_group_shares_shared_with_user_id_status_idx";--> statement-breakpoint
DROP INDEX "commitment_group_shares_invited_email_status_idx";--> statement-breakpoint
DROP INDEX "commitment_group_shares_group_id_invited_email_idx";--> statement-breakpoint
DROP INDEX "commitment_group_shares_group_id_shared_with_user_id_idx";--> statement-breakpoint
DROP INDEX "commitment_groups_user_id_idx";--> statement-breakpoint
DROP INDEX "commitment_groups_user_id_name_idx";--> statement-breakpoint
DROP INDEX "commitments_user_id_idx";--> statement-breakpoint
DROP INDEX "commitments_group_id_idx";--> statement-breakpoint
DROP INDEX "commitments_group_order_idx";--> statement-breakpoint
ALTER TABLE "priority_group_shares" ADD CONSTRAINT "priority_group_shares_group_id_priority_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."priority_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priority_group_shares" ADD CONSTRAINT "priority_group_shares_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priority_group_shares" ADD CONSTRAINT "priority_group_shares_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priority_groups" ADD CONSTRAINT "priority_groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priorities" ADD CONSTRAINT "priorities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "priorities" ADD CONSTRAINT "priorities_group_id_priority_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."priority_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "priority_group_shares_group_id_idx" ON "priority_group_shares" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "priority_group_shares_group_id_status_idx" ON "priority_group_shares" USING btree ("group_id","status");--> statement-breakpoint
CREATE INDEX "priority_group_shares_shared_with_user_id_idx" ON "priority_group_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "priority_group_shares_shared_with_user_id_status_idx" ON "priority_group_shares" USING btree ("shared_with_user_id","status");--> statement-breakpoint
CREATE INDEX "priority_group_shares_invited_email_status_idx" ON "priority_group_shares" USING btree ("invited_email","status");--> statement-breakpoint
CREATE UNIQUE INDEX "priority_group_shares_group_id_invited_email_idx" ON "priority_group_shares" USING btree ("group_id","invited_email");--> statement-breakpoint
CREATE UNIQUE INDEX "priority_group_shares_group_id_shared_with_user_id_idx" ON "priority_group_shares" USING btree ("group_id","shared_with_user_id");--> statement-breakpoint
CREATE INDEX "priority_groups_user_id_idx" ON "priority_groups" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "priority_groups_user_id_name_idx" ON "priority_groups" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "priorities_user_id_idx" ON "priorities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "priorities_group_id_idx" ON "priorities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "priorities_group_order_idx" ON "priorities" USING btree ("user_id","group_id","position");
