import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const profileSchema = z.object({
  displayName: z.string().optional(),
  age: z
    .number({ error: "L'âge est requis" })
    .int({ error: "L'âge doit être un nombre entier" })
    .min(16, { error: "L'âge doit être d'au moins 16 ans" })
    .max(100, { error: "L'âge doit être de 100 ans maximum" }),
  gender: z.enum(["homme", "femme", "autre", "prefer_not_to_say"], {
    error: "Le genre est requis",
  }),
  profession: z.string().optional(),
  habitualSleepTime: z
    .string({ error: "L'heure de coucher est requise" })
    .regex(timeRegex, { error: "Format HH:MM requis" }),
  habitualWakeTime: z
    .string({ error: "L'heure de lever est requise" })
    .regex(timeRegex, { error: "Format HH:MM requis" }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
