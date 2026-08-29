import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Lecture des collectes réelles pour le Results Studio (équipe Sawaz authentifiée).
 * RLS s'applique en tant qu'utilisateur : un analyste ne voit que ses clients assignés.
 * Aucune fonction d'analyse ou de review n'est modifiée ici.
 */

export type RealSubmission = {
  id: string;
  status: string;
  submittedAt: string | null;
  updatedAt: string;
  answers: number;
  files: { id: string; slot: string; name: string; size: number; mime: string }[];
};

export const listRealSubmissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clientSlug: string }) => ({
    clientSlug: String(input.clientSlug ?? ""),
  }))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; data: RealSubmission[] } | { ok: false; error: string }> => {
      const { supabase } = context;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("slug", data.clientSlug)
        .maybeSingle();

      if (!client) return { ok: true, data: [] };

      const { data: submissions, error } = await supabase
        .from("submissions")
        .select(
          "id, status, submitted_at, updated_at, answers(id), files(id, slot_key, original_name, size_bytes, mime)",
        )
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (error) return { ok: false, error: "Lecture impossible" };

      return {
        ok: true,
        data: (submissions ?? []).map((s) => ({
          id: s.id,
          status: s.status,
          submittedAt: s.submitted_at,
          updatedAt: s.updated_at,
          answers: (s.answers ?? []).length,
          files: (s.files ?? []).map((f) => ({
            id: f.id,
            slot: f.slot_key,
            name: f.original_name,
            size: Number(f.size_bytes ?? 0),
            mime: f.mime ?? "",
          })),
        })),
      };
    },
  );
