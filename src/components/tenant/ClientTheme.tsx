import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ClientConfig } from "@/lib/tenant/types";

/**
 * Applique les design tokens du client sur un sous-arbre.
 * Aucune couleur client n'est écrite en dur dans les composants.
 */
export function ClientTheme({
  client,
  children,
  className,
}: {
  client: ClientConfig;
  children: ReactNode;
  className?: string;
}) {
  const t = client.theme;
  const style = {
    "--background": t.background,
    "--surface": t.surface,
    "--surface-raised": t.surfaceRaised,
    "--card": t.surface,
    "--popover": t.surfaceRaised,
    "--foreground": t.foreground,
    "--card-foreground": t.foreground,
    "--muted-foreground": t.mutedForeground,
    "--primary": t.primary,
    "--primary-foreground": t.primaryForeground,
    "--sawaz": t.accent,
    "--sawaz-foreground": t.accentForeground,
    "--ring": t.primary,
    "--border": t.border,
    "--border-strong": t.borderStrong,
    "--radius": t.radius,
    fontFamily: t.fontSans,
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  } as CSSProperties;

  return (
    <div style={style} className={cn(className)}>
      {children}
    </div>
  );
}

export function ClientLogo({ client, className }: { client: ClientConfig; className?: string }) {
  if (!client.brand.logoUrl) {
    return (
      <span
        className={cn(
          "font-display text-lg font-extrabold tracking-tight text-primary",
          className,
        )}
      >
        {client.name}
      </span>
    );
  }
  return (
    <img
      src={client.brand.logoUrl}
      alt={client.brand.logoAlt}
      className={cn("w-auto object-contain", client.brand.logoClassName ?? "h-9", className)}
    />
  );
}
