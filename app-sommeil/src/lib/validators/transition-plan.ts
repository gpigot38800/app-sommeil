import { z } from "zod";

export const createTransitionPlanSchema = z
  .object({
    fromShiftId: z.string().uuid({ message: "ID du shift de départ invalide" }),
    toShiftId: z.string().uuid({ message: "ID du shift d'arrivée invalide" }),
    availableDays: z
      .number()
      .int()
      .min(2, { message: "Minimum 2 jours requis" })
      .max(6, { message: "Maximum 6 jours autorisés" }),
  })
  .refine((data) => data.fromShiftId !== data.toShiftId, {
    message: "Les shifts de départ et d'arrivée doivent être différents",
    path: ["toShiftId"],
  });

export type CreateTransitionPlanValues = z.infer<typeof createTransitionPlanSchema>;
