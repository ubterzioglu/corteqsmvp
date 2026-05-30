import { useState, useCallback, useEffect } from "react";

export interface RelocationResearch {
  id: string;
  title: string;
  targetCountry: string;
  targetCity: string;
  profession: string;
  familyStatus: string;
  spouseWorking: string;
  spouseProfession: string;
  userExperience: string;
  spouseExperience: string;
  childrenCount: number;
  childrenAges: string;
  currentCountry: string;
  chatMessages: { role: "user" | "assistant"; content: string }[];
  savedDocs: { title: string; content: string; type: "checklist" | "chat" | "report"; date: string }[];
  checklistState: { item: string; cost: string; done: boolean }[] | null;
  requiredDocsState: { doc: string; category: string; note: string; done: boolean }[] | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "__diaspora_relocation_researches__";

const loadResearches = (): RelocationResearch[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistResearches = (researches: RelocationResearch[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(researches));
  } catch {
    // storage full – silently ignore
  }
};

export const useRelocationResearches = () => {
  const [researches, setResearches] = useState<RelocationResearch[]>(loadResearches);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setResearches(loadResearches());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const save = useCallback((research: RelocationResearch) => {
    setResearches((prev) => {
      const idx = prev.findIndex((r) => r.id === research.id);
      const updated = idx >= 0
        ? prev.map((r, i) => (i === idx ? { ...research, updatedAt: new Date().toISOString() } : r))
        : [...prev, { ...research, updatedAt: new Date().toISOString() }];
      persistResearches(updated);
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setResearches((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persistResearches(updated);
      return updated;
    });
  }, []);

  const getById = useCallback(
    (id: string) => researches.find((r) => r.id === id) ?? null,
    [researches]
  );

  return { researches, save, remove, getById };
};
