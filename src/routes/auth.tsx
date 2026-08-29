import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { SawazMark } from "@/components/brand/Logos";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion équipe — Sawaz Results Studio" },
      {
        name: "description",
        content:
          "Accès réservé à l'équipe Sawaz : connexion sécurisée au Results Studio interne multi-client.",
      },
      { property: "og:title", content: "Connexion équipe — Sawaz Results Studio" },
      {
        property: "og:description",
        content: "Accès réservé à l'équipe Sawaz au Results Studio interne.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/studio` },
          });
    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.data.session) navigate({ to: "/studio" });
    else setError("Vérifie ta boîte mail pour confirmer ton adresse.");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <SawazMark />
          <span className="leading-tight">
            <span className="block font-display text-sm font-extrabold text-foreground">
              Results Studio
            </span>
            <span className="text-eyebrow text-sawaz">Accès équipe Sawaz</span>
          </span>
        </div>

        <form onSubmit={submit} className="surface-panel space-y-4 p-6">
          <h1 className="font-display text-xl font-extrabold text-foreground">
            {mode === "signin" ? "Connexion" : "Créer un accès"}
          </h1>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Email professionnel</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-foreground outline-none focus:border-sawaz"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Mot de passe</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-foreground outline-none focus:border-sawaz"
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-sawaz px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
          >
            {busy ? "Un instant…" : mode === "signin" ? "Se connecter" : "Créer l'accès"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Premier accès équipe ? Créer un compte" : "J'ai déjà un accès"}
          </button>
        </form>
      </div>
    </div>
  );
}
