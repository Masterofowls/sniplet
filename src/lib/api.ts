import { invoke } from "@tauri-apps/api/core";
import type { Snippet, SnippetStore } from "./types";

export const api = {
  listSnippets: () => invoke<SnippetStore>("list_snippets"),
  saveSnippet: (snippet: Snippet) => invoke<Snippet>("save_snippet", { snippet }),
  createSnippet: (title: string, code: string, language: string, tags: string[]) =>
    invoke<Snippet>("create_snippet", { title, code, language, tags }),
  removeSnippet: (id: string) => invoke<boolean>("remove_snippet", { id }),
  importSnippets: (payload: string) => invoke<Snippet[]>("import_snippets", { payload }),
  exportSnippets: () => invoke<string>("export_snippets"),
  quickCopy: (content: string) => invoke<void>("quick_copy", { content }),
  readClipboard: () => invoke<string>("read_clipboard"),
  duplicateSnippet: (id: string) => invoke<Snippet>("duplicate_snippet", { id }),
  mergeRemoteStore: (remote: SnippetStore) =>
    invoke<SnippetStore>("merge_remote_store", { remote }),
};
