import { LazyStore } from "@tauri-apps/plugin-store";
import { v4 as uuidv4 } from "uuid";
import type { Snippet, SnippetStore } from "./types";

const SNIPPET_STORE_FILE = "snippets.json";
const STORE_KEY = "data";

const snippetStore = new LazyStore(SNIPPET_STORE_FILE);

function emptyStore(): SnippetStore {
  return { version: 1, snippets: [], updated_at: null };
}

export async function loadStore(): Promise<SnippetStore> {
  const data = await snippetStore.get<SnippetStore>(STORE_KEY);
  return data ?? emptyStore();
}

async function persistStore(store: SnippetStore): Promise<SnippetStore> {
  const next = { ...store, updated_at: new Date().toISOString() };
  await snippetStore.set(STORE_KEY, next);
  await snippetStore.save();
  return next;
}

export function createSnippet(
  title: string,
  code: string,
  language: string,
  tags: string[],
): Snippet {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title,
    code,
    language,
    tags,
    favorite: false,
    created_at: now,
    updated_at: now,
  };
}

export async function saveSnippet(snippet: Snippet): Promise<Snippet> {
  const store = await loadStore();
  const updated = { ...snippet, updated_at: new Date().toISOString() };
  const index = store.snippets.findIndex((item) => item.id === updated.id);
  if (index >= 0) {
    store.snippets[index] = updated;
  } else {
    store.snippets.unshift(updated);
  }
  await persistStore(store);
  return updated;
}

export async function removeSnippet(id: string): Promise<boolean> {
  const store = await loadStore();
  const before = store.snippets.length;
  store.snippets = store.snippets.filter((snippet) => snippet.id !== id);
  if (store.snippets.length === before) {
    return false;
  }
  await persistStore(store);
  return true;
}

interface ImportPayload {
  title?: string;
  code: string;
  language?: string;
  tags?: string[];
}

export function parseImportPayload(payload: string): ImportPayload[] {
  try {
    const parsed = JSON.parse(payload) as ImportPayload | ImportPayload[];
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item.code === "string");
    }
    if (typeof parsed.code === "string") {
      return [parsed];
    }
  } catch {
    // Plain text import
  }
  return [{ code: payload }];
}

export async function importSnippets(payload: string): Promise<Snippet[]> {
  const items = parseImportPayload(payload);
  const created: Snippet[] = [];
  for (const item of items) {
    const snippet = createSnippet(
      item.title ?? "Imported snippet",
      item.code,
      item.language ?? "plaintext",
      item.tags ?? [],
    );
    created.push(await saveSnippet(snippet));
  }
  return created;
}

export async function exportSnippets(): Promise<string> {
  const store = await loadStore();
  return JSON.stringify(store, null, 2);
}

export function mergeStores(local: SnippetStore, remote: SnippetStore): SnippetStore {
  const merged = { ...local, snippets: [...local.snippets] };
  for (const remoteSnippet of remote.snippets) {
    const index = merged.snippets.findIndex((item) => item.id === remoteSnippet.id);
    if (index >= 0) {
      if (remoteSnippet.updated_at > merged.snippets[index].updated_at) {
        merged.snippets[index] = remoteSnippet;
      }
    } else {
      merged.snippets.push(remoteSnippet);
    }
  }
  merged.updated_at = new Date().toISOString();
  return merged;
}

export async function mergeRemoteStore(remote: SnippetStore): Promise<SnippetStore> {
  const local = await loadStore();
  const merged = mergeStores(local, remote);
  await snippetStore.set(STORE_KEY, merged);
  await snippetStore.save();
  return merged;
}

export async function duplicateSnippet(id: string): Promise<Snippet> {
  const store = await loadStore();
  const source = store.snippets.find((snippet) => snippet.id === id);
  if (!source) {
    throw new Error("Snippet not found");
  }
  const now = new Date().toISOString();
  const copy: Snippet = {
    ...source,
    id: uuidv4(),
    title: `${source.title} (copy)`,
    created_at: now,
    updated_at: now,
  };
  return saveSnippet(copy);
}
