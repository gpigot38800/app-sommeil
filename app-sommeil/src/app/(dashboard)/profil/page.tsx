import { requireUser } from "@/lib/supabase/get-user";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProfileForm } from "@/components/forms/profile-form";

export default async function ProfilPage() {
  const user = await requireUser();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id));

  const isNewUser = !profile || !profile.age || !profile.habitualSleepTime;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {isNewUser ? "Bienvenue !" : "Mon profil"}
      </h1>
      {isNewUser && (
        <p className="text-muted-foreground">
          Pour commencer, veuillez compléter votre profil avec vos informations
          personnelles et vos habitudes de sommeil.
        </p>
      )}
      <ProfileForm
        defaultValues={
          profile
            ? {
                displayName: profile.displayName ?? "",
                age: profile.age ?? undefined,
                gender: (profile.gender as "homme" | "femme" | "autre" | "prefer_not_to_say") ?? undefined,
                profession: profile.profession ?? "",
                habitualSleepTime: profile.habitualSleepTime ?? "",
                habitualWakeTime: profile.habitualWakeTime ?? "",
              }
            : undefined
        }
        isNewUser={isNewUser}
      />
    </div>
  );
}
