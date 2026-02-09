CREATE TABLE "admin_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"display_name" text,
	"email" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"matricule" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"department" text,
	"position" text,
	"employment_type" text DEFAULT 'temps_plein',
	"contract_hours_per_week" numeric DEFAULT '35',
	"habitual_sleep_time" time DEFAULT '23:00',
	"habitual_wake_time" time DEFAULT '07:00',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fatigue_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"window_days" integer NOT NULL,
	"cumulative_deficit_minutes" integer DEFAULT 0 NOT NULL,
	"recovery_score" integer DEFAULT 100 NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"shift_count" integer DEFAULT 0 NOT NULL,
	"night_shift_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"code" text NOT NULL,
	"label" text,
	"shift_category" text NOT NULL,
	"default_start_time" time,
	"default_end_time" time,
	"default_duration_minutes" integer,
	"includes_break_minutes" integer DEFAULT 0,
	"is_work_shift" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_shifts" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "work_shifts" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "work_shifts" ADD COLUMN "employee_id" uuid;--> statement-breakpoint
ALTER TABLE "work_shifts" ADD COLUMN "shift_code" text;--> statement-breakpoint
ALTER TABLE "work_shifts" ADD COLUMN "break_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fatigue_scores" ADD CONSTRAINT "fatigue_scores_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fatigue_scores" ADD CONSTRAINT "fatigue_scores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_codes" ADD CONSTRAINT "shift_codes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_shifts" ADD CONSTRAINT "work_shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_shifts" ADD CONSTRAINT "work_shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;