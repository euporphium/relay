CREATE TYPE "public"."share_invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'revoked', 'left');--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ALTER COLUMN "shared_with_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "invited_by_user_id" text;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "invited_email" text;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "status" "share_invitation_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "invited_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "responded_at" timestamp;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "revoked_at" timestamp;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD COLUMN "left_at" timestamp;--> statement-breakpoint
UPDATE "commitment_group_shares" AS "shares"
SET
  "invited_by_user_id" = "groups"."user_id",
  "invited_email" = lower("target_user"."email"),
  "status" = 'accepted',
  "invited_at" = "shares"."created_at",
  "responded_at" = "shares"."created_at",
  "accepted_at" = "shares"."created_at"
FROM "commitment_groups" AS "groups", "auth"."user" AS "target_user"
WHERE
  "groups"."id" = "shares"."group_id"
  AND "target_user"."id" = "shares"."shared_with_user_id";--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ALTER COLUMN "invited_by_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ALTER COLUMN "invited_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commitment_group_shares" ADD CONSTRAINT "commitment_group_shares_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commitment_group_shares_group_id_status_idx" ON "commitment_group_shares" USING btree ("group_id","status");--> statement-breakpoint
CREATE INDEX "commitment_group_shares_shared_with_user_id_status_idx" ON "commitment_group_shares" USING btree ("shared_with_user_id","status");--> statement-breakpoint
CREATE INDEX "commitment_group_shares_invited_email_status_idx" ON "commitment_group_shares" USING btree ("invited_email","status");--> statement-breakpoint
CREATE UNIQUE INDEX "commitment_group_shares_group_id_invited_email_idx" ON "commitment_group_shares" USING btree ("group_id","invited_email");
