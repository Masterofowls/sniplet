import { describe, expect, it } from "vitest";
import { mergeStores, parseImportPayload } from "../lib/snippetStorage";
import type { Snippet, SnippetStore } from "../lib/types";

const sampleSnippet = (overrides: Partial<Snippet> = {}): Snippet => ({
  id: "1",
  title: "Hello World",
  code: 'console.log("hello");',
  language: "javascript",
  tags: ["demo", "js"],
  favorite: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("parseImportPayload", () => {
  it("parses plain text", () => {
    expect(parseImportPayload("hello")).toEqual([{ code: "hello" }]);
  });

  it("parses json array", () => {
    expect(parseImportPayload('[{"code":"a"},{"code":"b"}]')).toHaveLength(2);
  });
});

describe("mergeStores", () => {
  it("keeps newer snippet by updated_at", () => {
    const local: SnippetStore = {
      version: 1,
      snippets: [sampleSnippet({ updated_at: "2026-01-01T00:00:00Z" })],
    };
    const remote: SnippetStore = {
      version: 1,
      snippets: [sampleSnippet({ title: "Remote", updated_at: "2026-02-01T00:00:00Z" })],
    };
    const merged = mergeStores(local, remote);
    expect(merged.snippets[0].title).toBe("Remote");
  });

  it("adds remote-only snippets", () => {
    const local: SnippetStore = { version: 1, snippets: [] };
    const remote: SnippetStore = {
      version: 1,
      snippets: [sampleSnippet({ id: "remote" })],
    };
    expect(mergeStores(local, remote).snippets).toHaveLength(1);
  });
});
