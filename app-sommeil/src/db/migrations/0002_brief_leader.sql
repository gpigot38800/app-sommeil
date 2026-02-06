ALTER TABLE "plan_days" ALTER COLUMN "light_start" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_days" ALTER COLUMN "light_end" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plan_days" ADD COLUMN "shift_type" text;--> statement-breakpoint
ALTER TABLE "plan_days" ADD COLUMN "work_start_time" time;--> statement-breakpoint
ALTER TABLE "plan_days" ADD COLUMN "work_end_time" time;