"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  userEmail?: string | null;
  onMenuClick: () => void;
}

export function Navbar({ userEmail, onMenuClick }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userEmail
    ? userEmail.substring(0, 2).toUpperCase()
    : "??";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <span className="text-lg font-semibold md:hidden">App Sommeil</span>

      <div className="flex-1" />

      <ThemeToggle />

      <span className="hidden text-sm text-muted-foreground sm:inline">
        {userEmail ?? ""}
      </span>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground sm:hidden">
        {initials}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        aria-label="Se déconnecter"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
