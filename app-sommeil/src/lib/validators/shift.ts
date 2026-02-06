import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const shiftSchema = z
  .object({
    shiftType: z.enum(["jour", "soir", "nuit"], {
      error: "Le type de shift est requis",
    }),
    startDate: z.string().min(1, { error: "La date de début est requise" }),
    endDate: z.string().min(1, { error: "La date de fin est requise" }),
    startTime: z
      .string({ error: "L'heure de début est requise" })
      .regex(timeRegex, { error: "Format HH:MM requis" }),
    endTime: z
      .string({ error: "L'heure de fin est requise" })
      .regex(timeRegex, { error: "Format HH:MM requis" }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    error: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
  });

export type ShiftFormValues = z.infer<typeof shiftSchema>;
