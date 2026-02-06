CREATE TABLE "plan_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"target_sleep_time" time NOT NULL,
	"target_wake_time" time NOT NULL,
	"caffeine_cutoff" time NOT NULL,
	"light_start" time NOT NULL,
	"light_end" time NOT NULL,
	"deficit_minutes" integer DEFAULT 0,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "transition_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_shift" text NOT NULL,
	"to_shift" text NOT NULL,
	"start_date" date NOT NULL,
	"days_count" integer NOT NULL,
	"total_deficit_minutes" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan_days" ADD CONSTRAINT "plan_days_plan_id_transition_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."transition_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transition_plans" ADD CONSTRAINT "transition_plans_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;