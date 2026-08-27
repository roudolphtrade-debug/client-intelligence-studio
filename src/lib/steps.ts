export type StepId = "introduction" | "youtube" | "contenus" | "meta" | "validation";

export type Step = {
  id: StepId;
  index: number;
  label: string;
  shortLabel: string;
  to: string;
  summary: string;
};

export const STEPS: Step[] = [
  {
    id: "introduction",
    index: 1,
    label: "Introduction",
    shortLabel: "Intro",
    to: "/",
    summary: "Cadrage de la mission et des accès nécessaires.",
  },
  {
    id: "youtube",
    index: 2,
    label: "YouTube",
    shortLabel: "YouTube",
    to: "/youtube",
    summary: "Chaîne, historique et objectifs de la présence vidéo.",
  },
  {
    id: "contenus",
    index: 3,
    label: "Contenus",
    shortLabel: "Contenus",
    to: "/contenus",
    summary: "Formats, rythme de publication et bibliothèque existante.",
  },
  {
    id: "meta",
    index: 4,
    label: "Meta",
    shortLabel: "Meta",
    to: "/meta",
    summary: "Pages Facebook, Instagram et diffusion payante.",
  },
  {
    id: "validation",
    index: 5,
    label: "Validation",
    shortLabel: "Validation",
    to: "/validation",
    summary: "Relecture finale avant transmission à l'équipe Sawaz.",
  },
];

export const getStep = (id: StepId): Step => STEPS.find((s) => s.id === id)!;

export const stepNeighbours = (id: StepId) => {
  const i = STEPS.findIndex((s) => s.id === id);
  return { previous: STEPS[i - 1] ?? null, next: STEPS[i + 1] ?? null };
};
