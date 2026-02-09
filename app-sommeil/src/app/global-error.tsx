"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <h2 className="text-2xl font-bold">Erreur de connexion</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {error.message || "Une erreur inattendue s'est produite."}
            </p>
            <button
              onClick={reset}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
