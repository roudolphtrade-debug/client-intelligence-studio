export type AnswerValue = string | string[] | boolean | null;

export type FileMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: number;
};

export type CollectionState = {
  version: 1;
  answers: Record<string, AnswerValue>;
  files: Record<string, FileMeta[]>;
  submittedAt: number | null;
};

export const emptyState: CollectionState = {
  version: 1,
  answers: {},
  files: {},
  submittedAt: null,
};
