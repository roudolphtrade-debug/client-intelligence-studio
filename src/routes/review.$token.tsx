import { createFileRoute, notFound } from "@tanstack/react-router";
import { Lock, ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SawazMark } from "@/components/brand/Logos";
import { ClientLogo, ClientTheme } from "@/components/tenant/ClientTheme";
import { getClient } from "@/lib/tenant/clients";
import { getDossierByToken } from "@/lib/tenant/dossiers";

export const Route = createFileRoute("/review/$token")({
  head: () => ({
    meta: [
      { title: "Sawaz Strategic Review — Restitution client" },
      {
        name: "description",
        content:
          "Restitution stratégique Sawaz : synthèse, faits observés, interprétations, hypothèses et prochaines actions.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sawaz Strategic Review" },
      {
        property: "og:description",
        content: "Synthèse, faits observés, interprétations et prochaines actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ params }) => {
    const dossier = getDossierByToken(params.token);
    if (!dossier) throw notFound();
    return { token: params.token };
  },
  component: ReviewScreen,
});

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-panel p-5 sm:p-7">
      {eyebrow ? <p className="text-eyebrow text-primary">{eyebrow}</p> : null}
      <h2 className="mt-1 font-display text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ReviewScreen() {
  const { token } = Route.useLoaderData();
  const dossier = getDossierByToken(token)!;
  const client = getClient(dossier.clientId)!;
  const review = dossier.review;

  if (!review.published) {
    return (
      <ClientTheme client={client} className="grid min-h-screen place-items-center px-4">
        <div className="surface-panel max-w-md p-8 text-center">
          <Lock className="mx-auto size-6 text-primary" aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-extrabold text-foreground">
            Restitution en préparation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce lien est valide, mais l'analyse n'a pas encore été validée par l'équipe Sawaz. Tu
            recevras un email dès sa publication.
          </p>
        </div>
      </ClientTheme>
    );
  }

  return (
    <ClientTheme client={client} className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <ClientLogo client={client} />
          <div className="flex items-center gap-3">
            <span className="hidden text-eyebrow text-muted-foreground sm:block">
              Accompagné par
            </span>
            <SawazMark />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <p className="text-eyebrow text-primary">Sawaz Strategic Review</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {client.name} — lecture de la première vague
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Publiée le {review.publishedAt} · document confidentiel, accessible par lien sécurisé.
          </p>
        </div>

        <Section eyebrow="Synthèse" title="Ce que disent les données">
          <p className="text-base leading-relaxed text-foreground">{review.synthesis}</p>
        </Section>

        <Section eyebrow="Faits observés" title="Ce qui a été mesuré">
          <Bullets items={review.facts} />
        </Section>

        <Section eyebrow="Graphiques" title="Volume comparé et structure d'audience">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={review.charts.acquisition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 8,
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="youtube" stroke="var(--primary)" strokeWidth={2} />
                  <Line type="monotone" dataKey="meta" stroke="var(--sawaz)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={review.charts.retention}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
                  <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--surface-raised)" }}
                    contentStyle={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 8,
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {review.charts.retention.map((entry, i) => (
                      <Cell
                        key={entry.label}
                        fill={i === 0 ? "var(--primary)" : "var(--sawaz)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        <Section eyebrow="Interprétations" title="Ce que cela signifie">
          <Bullets items={review.interpretations} />
        </Section>

        <Section eyebrow="Hypothèses" title="Ce qu'il reste à confirmer">
          <Bullets items={review.hypotheses} />
        </Section>

        <Section eyebrow="Recommandations" title="Ce que nous conseillons">
          <div className="grid gap-3 sm:grid-cols-2">
            {review.recommendations.map((r) => (
              <article
                key={r.title}
                className="rounded-lg border border-border bg-surface-raised p-4"
              >
                <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section eyebrow="Prochaines actions" title="La suite du parcours">
          <ul className="space-y-2">
            {review.nextActions.map((a) => (
              <li
                key={a.title}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3"
              >
                <span className="text-sm font-medium text-foreground">{a.title}</span>
                <span className="text-xs text-muted-foreground">
                  {a.owner} · {a.horizon}
                </span>
              </li>
            ))}
          </ul>
          <a
            href="mailto:contact@sawaz.fr"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {client.ctaLabel}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </Section>

        <p className="pb-6 text-center text-xs text-muted-foreground">
          Document confidentiel — Sawaz Strategic Review · {client.name}
        </p>
      </main>
    </ClientTheme>
  );
}
