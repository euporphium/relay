CREATE TYPE "public"."task_resolution_type" AS ENUM('completed', 'skipped');--> statement-breakpoint
ALTER TABLE "task_completions" RENAME TO "task_resolutions";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "archived_at" TO "resolved_at";--> statement-breakpoint
ALTER TABLE "task_resolutions" DROP CONSTRAINT "task_completions_task_id_tasks_id_fk";
--> statement-breakpoint
DROP INDEX "tasks_active_scheduled_date_idx";--> statement-breakpoint
ALTER TABLE "task_resolutions" ADD COLUMN "type" "task_resolution_type" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "task_resolutions" ADD CONSTRAINT "task_resolutions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_active_scheduled_date_idx" ON "tasks" USING btree ("user_id","scheduled_date") WHERE "tasks"."resolved_at" is null;