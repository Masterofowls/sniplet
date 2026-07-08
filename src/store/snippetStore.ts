import { create } from "zustand";
import { api } from "../lib/api";
import * as github from "../lib/githubSync";
import type { AuthStatus, Snippet, SnippetStore } from "../lib/types";

interface SnippetState {
  snippets: Snippet[];
  loading: boolean;
  error: string | null;
  auth: AuthStatus | null;
  search: string;
  selectedTag: string | null;
  showFavoritesOnly: boolean;
  loadSnippets: () => Promise<void>;
  setSearch: (value: string) => void;
  setSelectedTag: (tag: string | null) => void;
  toggleFavoritesOnly: () => void;
  upsertSnippet: (snippet: Snippet) => Promise<void>;
  addSnippet: (title: string, code: string, language: string, tags: string[]) => Promise<Snippet>;
  deleteSnippet: (id: string) => Promise<void>;
  importFromClipboard: () => Promise<Snippet[]>;
  importFromText: (text: string) => Promise<Snippet[]>;
  copySnippet: (content: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  pushSync: () => Promise<void>;
  pullSync: () => Promise<void>;
}

function applyStore(store: SnippetStore, set: (partial: Partial<SnippetState>) => void) {
  set({ snippets: store.snippets, loading: false, error: null });
}

export const useSnippetStore = create<SnippetState>((set, get) => ({
  snippets: [],
  loading: true,
  error: null,
  auth: null,
  search: "",
  selectedTag: null,
  showFavoritesOnly: false,

  loadSnippets: async () => {
    set({ loading: true, error: null });
    try {
      const store = await api.listSnippets();
      applyStore(store, set);
    } catch (err) {
      set({ loading: false, error: String(err) });
    }
  },

  setSearch: (value) => set({ search: value }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  toggleFavoritesOnly: () => set({ showFavoritesOnly: !get().showFavoritesOnly }),

  upsertSnippet: async (snippet) => {
    const saved = await api.saveSnippet(snippet);
    set({
      snippets: get().snippets.some((s) => s.id === saved.id)
        ? get().snippets.map((s) => (s.id === saved.id ? saved : s))
        : [saved, ...get().snippets],
    });
  },

  addSnippet: async (title, code, language, tags) => {
    const saved = await api.createSnippet(title, code, language, tags);
    set({ snippets: [saved, ...get().snippets] });
    return saved;
  },

  deleteSnippet: async (id) => {
    await api.removeSnippet(id);
    set({ snippets: get().snippets.filter((s) => s.id !== id) });
  },

  importFromClipboard: async () => {
    const text = await api.readClipboard();
    const imported = await api.importSnippets(text);
    set({ snippets: [...imported, ...get().snippets] });
    return imported;
  },

  importFromText: async (text) => {
    const imported = await api.importSnippets(text);
    set({ snippets: [...imported, ...get().snippets] });
    return imported;
  },

  copySnippet: async (content) => {
    await api.quickCopy(content);
  },

  duplicate: async (id) => {
    const copy = await api.duplicateSnippet(id);
    set({ snippets: [copy, ...get().snippets] });
  },

  refreshAuth: async () => {
    const auth = await github.getAuthStatus();
    set({ auth });
  },

  logout: async () => {
    await github.logout();
    set({ auth: { authenticated: false } });
  },

  pushSync: async () => {
    const auth = await github.pushSync();
    set({ auth });
  },

  pullSync: async () => {
    const store = await github.pullSync();
    applyStore(store, set);
    await get().refreshAuth();
  },
}));

export function filterSnippets(
  snippets: Snippet[],
  search: string,
  selectedTag: string | null,
  showFavoritesOnly: boolean,
): Snippet[] {
  const query = search.trim().toLowerCase();
  return snippets.filter((snippet) => {
    if (showFavoritesOnly && !snippet.favorite) return false;
    if (selectedTag && !snippet.tags.includes(selectedTag)) return false;
    if (!query) return true;
    return (
      snippet.title.toLowerCase().includes(query) ||
      snippet.code.toLowerCase().includes(query) ||
      snippet.language.toLowerCase().includes(query) ||
      snippet.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });
}

export function collectTags(snippets: Snippet[]): string[] {
  const tags = new Set<string>();
  for (const snippet of snippets) {
    for (const tag of snippet.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
