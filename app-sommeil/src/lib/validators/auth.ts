import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { error: "L'email est requis" })
    .email({ error: "Veuillez entrer un email valide" }),
  password: z
    .string()
    .min(1, { error: "Le mot de passe est requis" }),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, { error: "L'email est requis" })
    .email({ error: "Veuillez entrer un email valide" }),
  password: z
    .string()
    .min(6, { error: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirmPassword: z
    .string()
    .min(1, { error: "Veuillez confirmer le mot de passe" }),
}).refine((data) => data.password === data.confirmPassword, {
  error: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
