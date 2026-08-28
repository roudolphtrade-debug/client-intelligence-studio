import lftcAsset from "@/assets/logo-lftc.png.asset.json";

import type { ClientConfig } from "./types";

/**
 * Registre client. LFTC est ici uniquement en tant que client de démonstration.
 * Ajouter un client = ajouter une entrée, aucun code UI à modifier.
 */

const darkBase = {
  background: "oklch(0.145 0.004 285.8)",
  surface: "oklch(0.196 0.004 285.8)",
  surfaceRaised: "oklch(0.235 0.005 285.8)",
  foreground: "oklch(0.968 0 0)",
  mutedForeground: "oklch(0.68 0.005 285.8)",
  border: "oklch(1 0 0 / 8%)",
  borderStrong: "oklch(1 0 0 / 16%)",
  fontSans: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  fontDisplay: '"Manrope", ui-sans-serif, system-ui, sans-serif',
  radius: "0.875rem",
};

export const CLIENTS: ClientConfig[] = [
  {
    id: "lftc",
    name: "LFTC",
    sector: "Formation & communauté",
    contact: "Raphaël",
    ctaLabel: "Planifier le point stratégique",
    brand: {
      logoUrl: lftcAsset.url,
      logoAlt: "LFTC",
      logoClassName: "h-9 w-auto sm:h-10",
    },
    theme: {
      ...darkBase,
      primary: "oklch(0.822 0.163 82.5)",
      primaryForeground: "oklch(0.145 0.004 285.8)",
      accent: "oklch(0.706 0.132 227.5)",
      accentForeground: "oklch(0.145 0.004 285.8)",
    },
  },
  {
    id: "northline",
    name: "Northline Studio",
    sector: "Média & production",
    contact: "Camille",
    ctaLabel: "Réserver la session de restitution",
    brand: {
      logoUrl: "",
      logoAlt: "Northline Studio",
    },
    theme: {
      ...darkBase,
      background: "oklch(0.16 0.02 250)",
      surface: "oklch(0.21 0.025 250)",
      surfaceRaised: "oklch(0.25 0.028 250)",
      primary: "oklch(0.78 0.14 165)",
      primaryForeground: "oklch(0.16 0.02 250)",
      accent: "oklch(0.72 0.13 300)",
      accentForeground: "oklch(0.16 0.02 250)",
      radius: "0.5rem",
    },
  },
];

export function getClient(id: string): ClientConfig | undefined {
  return CLIENTS.find((c) => c.id === id);
}
