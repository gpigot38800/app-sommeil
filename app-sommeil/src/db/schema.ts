import {
  pgTable,
  uuid,
  text,
  integer,
  time,
  timestamp,
  date,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

// ─── B2B tables ───────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adminProfiles = pgTable("admin_profiles", {
  id: uuid("id").primaryKey(), // FK auth.users — set manually on insert
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  displayName: text("display_name"),
  email: text("email"),
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  matricule: text("matricule"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  department: text("department"),
  position: text("position"),
  employmentType: text("employment_type").default("temps_plein"),
  contractHoursPerWeek: numeric("contract_hours_per_week").default("35"),
  habitualSleepTime: time("habitual_sleep_time").default("23:00"),
  habitualWakeTime: time("habitual_wake_time").default("07:00"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const shiftCodes = pgTable("shift_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  code: text("code").notNull(),
  label: text("label"),
  shiftCategory: text("shift_category").notNull(), // jour | soir | nuit | repos | absence
  defaultStartTime: time("default_start_time"),
  defaultEndTime: time("default_end_time"),
  defaultDurationMinutes: integer("default_duration_minutes"),
  includesBreakMinutes: integer("includes_break_minutes").default(0),
  isWorkShift: boolean("is_work_shift").default(true).notNull(),
});

export const workShifts = pgTable("work_shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  employeeId: uuid("employee_id").references(() => employees.id, {
    onDelete: "cascade",
  }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  shiftType: text("shift_type").notNull(),
  startTime: time("start_time"), // Nullable pour les repos/absences
  endTime: time("end_time"), // Nullable pour les repos/absences
  shiftCode: text("shift_code"),
  breakMinutes: integer("break_minutes").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const fatigueScores = pgTable("fatigue_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .references(() => employees.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  windowDays: integer("window_days").notNull(),
  cumulativeDeficitMinutes: integer("cumulative_deficit_minutes")
    .default(0)
    .notNull(),
  recoveryScore: integer("recovery_score").default(100).notNull(),
  riskLevel: text("risk_level").default("low").notNull(), // low | medium | high | critical
  shiftCount: integer("shift_count").default(0).notNull(),
  nightShiftCount: integer("night_shift_count").default(0).notNull(),
});
