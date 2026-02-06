import { z } from "zod";

export const createTransitionPlanSchema = z
  .object({
    fromShiftId: z.string().uuid({ message: "ID du shift de départ invalide" }),
    toShiftId: z.string().uuid({ message: "ID du shift d'arrivée invalide" }),
  })
  .refine((data) => data.fromShiftId !== data.toShiftId, {
    message: "Les shifts de départ et d'arrivée doivent être différents",
    path: ["toShiftId"],
  });

export type CreateTransitionPlanValues = z.infer<typeof createTransitionPlanSchema>;
