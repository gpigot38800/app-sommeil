"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);

  // Check if user is already authenticated (needs onboarding only)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setExistingUserId(user.id);
        setExistingEmail(user.email ?? null);
      }
    });
  }, []);

  const isOnboarding = !!existingUserId;

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
    },
  });

  // Pre-fill email when user is already authenticated
  useEffect(() => {
    if (existingEmail) {
      form.setValue("email", existingEmail);
      form.setValue("password", "placeholder1");
      form.setValue("confirmPassword", "placeholder1");
    }
  }, [existingEmail, form]);

  async function onSubmit(values: RegisterFormValues) {
    setLoading(true);
    setError(null);

    let userId = existingUserId;

    if (!isOnboarding) {
      // New user: sign up first
      const supabase = createClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Cet email est déjà utilisé. Essayez de vous connecter.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }
      userId = signUpData.user?.id ?? null;
    }

    // Create organization + admin profile via API
    const res = await fetch("/api/auth/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationName: values.organizationName,
        email: isOnboarding ? existingEmail : values.email,
        userId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création de l'organisation.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isOnboarding ? "Configurer votre établissement" : "Créer un compte"}
        </CardTitle>
        <CardDescription>
          {isOnboarding
            ? "Dernière étape : nommez votre établissement pour commencer"
            : "Configurez votre établissement pour gérer la fatigue de vos équipes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l&apos;établissement</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CHU de Lyon, Clinique Saint-Joseph..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isOnboarding && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="nom@exemple.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="6 caractères minimum"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirmez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Création en cours..."
                : isOnboarding
                  ? "Commencer"
                  : "Créer mon compte"}
            </Button>
          </form>
        </Form>
      </CardContent>
      {!isOnboarding && (
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary underline">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
