import {
  pgTable,
  uuid,
  text,
  integer,
  time,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  age: integer("age"),
  gender: text("gender"),
  profession: text("profession"),
  habitualSleepTime: time("habitual_sleep_time"),
  habitualWakeTime: time("habitual_wake_time"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const workShifts = pgTable("work_shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  shiftType: text("shift_type").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const transitionPlans = pgTable("transition_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  fromShift: text("from_shift").notNull(),
  toShift: text("to_shift").notNull(),
  startDate: date("start_date").notNull(),
  daysCount: integer("days_count").notNull(),
  totalDeficitMinutes: integer("total_deficit_minutes").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const planDays = pgTable("plan_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => transitionPlans.id, { onDelete: "cascade" })
    .notNull(),
  dayNumber: integer("day_number").notNull(),
  targetSleepTime: time("target_sleep_time").notNull(),
  targetWakeTime: time("target_wake_time").notNull(),
  caffeineCutoff: time("caffeine_cutoff").notNull(),
  lightStart: time("light_start"),
  lightEnd: time("light_end"),
  deficitMinutes: integer("deficit_minutes").default(0),
  notes: text("notes"),
  shiftType: text("shift_type"),
  workStartTime: time("work_start_time"),
  workEndTime: time("work_end_time"),
});
