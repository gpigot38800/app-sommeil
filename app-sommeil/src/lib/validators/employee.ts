import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const employeeSchema = z.object({
  matricule: z.string().default(""),
  firstName: z.string().min(1, { error: "Le prénom est requis" }),
  lastName: z.string().min(1, { error: "Le nom est requis" }),
  department: z.string().default(""),
  position: z.string().default(""),
  employmentType: z
    .enum(["temps_plein", "temps_partiel", "interimaire"])
    .default("temps_plein"),
  contractHoursPerWeek: z.string().default("35"),
  habitualSleepTime: z
    .string()
    .regex(timeRegex, { error: "Format HH:MM requis" })
    .default("23:00"),
  habitualWakeTime: z
    .string()
    .regex(timeRegex, { error: "Format HH:MM requis" })
    .default("07:00"),
});

export type EmployeeFormValues = z.input<typeof employeeSchema>;
