import { FileText, UploadCloud } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";

type SampleFile = { name: string; meta: string };

/** Visual-only uploader: no file handling in V1. */
export function FileUploader({
  label,
  hint = "PDF, PNG, JPG ou CSV · 20 Mo maximum",
  files = [],
}: {
  label: string;
  hint?: string;
  files?: SampleFile[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-raised/60 px-5 py-8 text-center">
        <span
          className="grid size-11 place-items-center rounded-full border border-primary/35 bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <UploadCloud className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="inline-flex items-center rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-xs font-semibold text-foreground">
          Parcourir mes fichiers
        </span>
      </div>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.name}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-surface-raised text-muted-foreground"
                aria-hidden="true"
              >
                <FileText className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {file.name}
                </span>
                <span className="block text-xs text-muted-foreground">{file.meta}</span>
              </span>
              <StatusBadge tone="gold">Prêt</StatusBadge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
