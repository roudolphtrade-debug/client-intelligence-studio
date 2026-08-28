import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { collectionService } from "./collectionService";
import { emptyState, type AnswerValue, type CollectionState, type FileMeta } from "./types";

type Ctx = {
  state: CollectionState;
  hydrated: boolean;
  setAnswer: (key: string, value: AnswerValue) => void;
  addFiles: (slot: string, files: File[]) => void;
  removeFile: (slot: string, id: string) => void;
  markSubmitted: (at: number | null) => void;
  reset: () => void;
};

const CollectionContext = createContext<Ctx | null>(null);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CollectionState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    setState(collectionService.load());
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    collectionService.save(state);
  }, [state]);

  const setAnswer = useCallback((key: string, value: AnswerValue) => {
    setState((prev) => ({ ...prev, answers: { ...prev.answers, [key]: value } }));
  }, []);

  const addFiles = useCallback((slot: string, files: File[]) => {
    if (files.length === 0) return;
    const metas: FileMeta[] = files.map((file) => {
      const meta: FileMeta = {
        id: newId(),
        name: file.name,
        size: file.size,
        type: file.type,
        addedAt: Date.now(),
      };
      collectionService.registerFile(meta, file);
      return meta;
    });
    setState((prev) => ({
      ...prev,
      files: { ...prev.files, [slot]: [...(prev.files[slot] ?? []), ...metas] },
    }));
  }, []);

  const removeFile = useCallback((slot: string, id: string) => {
    collectionService.forgetFile(id);
    setState((prev) => ({
      ...prev,
      files: { ...prev.files, [slot]: (prev.files[slot] ?? []).filter((f) => f.id !== id) },
    }));
  }, []);

  const markSubmitted = useCallback((at: number | null) => {
    setState((prev) => ({ ...prev, submittedAt: at }));
  }, []);

  const reset = useCallback(() => {
    collectionService.clear();
    setState(emptyState);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ state, hydrated, setAnswer, addFiles, removeFile, markSubmitted, reset }),
    [state, hydrated, setAnswer, addFiles, removeFile, markSubmitted, reset],
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error("useCollection doit être utilisé dans <CollectionProvider>");
  return ctx;
}

export function useTextAnswer(key: string): [string, (v: string) => void] {
  const { state, setAnswer } = useCollection();
  const raw = state.answers[key];
  const value = typeof raw === "string" ? raw : "";
  return [value, (v: string) => setAnswer(key, v)];
}

export function useSingleChoice(key: string): [string | null, (v: string) => void] {
  const { state, setAnswer } = useCollection();
  const raw = state.answers[key];
  const value = typeof raw === "string" ? raw : null;
  return [value, (v: string) => setAnswer(key, v)];
}

export function useMultiChoice(key: string): [string[], (v: string) => void] {
  const { state, setAnswer } = useCollection();
  const raw = state.answers[key];
  const values = Array.isArray(raw) ? raw : [];
  const toggle = (v: string) =>
    setAnswer(key, values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return [values, toggle];
}

export function useBoolAnswer(key: string): [boolean, () => void] {
  const { state, setAnswer } = useCollection();
  const value = state.answers[key] === true;
  return [value, () => setAnswer(key, !value)];
}

export function useSlotFiles(slot: string) {
  const { state, addFiles, removeFile } = useCollection();
  const files = state.files[slot] ?? [];
  return {
    files,
    add: (list: File[]) => addFiles(slot, list),
    remove: (id: string) => removeFile(slot, id),
  };
}
