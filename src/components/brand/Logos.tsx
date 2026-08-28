import lftcAsset from "@/assets/logo-lftc.png.asset.json";
import sawazAsset from "@/assets/logo-sawaz.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * LFTC — marque cliente dominante.
 * Logo fourni, utilisé tel quel : aucune recréation, aucun étirement.
 */
export function LftcLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3.5", className)}>
      <img
        src={lftcAsset.url}
        alt="LFTC"
        width={1536}
        height={1024}
        className="h-10 w-auto object-contain sm:h-12"
      />
      <span className="hidden min-w-0 leading-tight sm:block">
        <span className="block text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Client Intelligence
        </span>
      </span>
    </span>
  );
}

/**
 * Sawaz Entertainment — signature d'accompagnement, plus discrète.
 * Logo fourni tel quel, posé sur une plaque claire pour rester lisible sur fond sombre.
 */
export function SawazMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-foreground/92 px-2.5 py-1.5",
        className,
      )}
    >
      <img
        src={sawazAsset.url}
        alt="Sawaz Entertainment"
        width={253}
        height={178}
        className="h-7 w-auto object-contain"
      />
    </span>
  );
}
