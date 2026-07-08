import { describe, expect, it } from "vitest";
import { detectLanguage, languageLabel } from "../lib/languages";
import type { Snippet } from "../lib/types";
import { collectTags, filterSnippets } from "../store/snippetStore";

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

describe("languages", () => {
  it("detects typescript", () => {
    expect(detectLanguage("const x: string = 'hi';")).toBe("typescript");
  });

  it("detects rust", () => {
    expect(detectLanguage("fn main() {}")).toBe("rust");
  });

  it("returns label for known language", () => {
    expect(languageLabel("rust")).toBe("Rust");
  });
});

describe("filterSnippets", () => {
  const snippets = [
    sampleSnippet(),
    sampleSnippet({ id: "2", title: "Rust sample", language: "rust", tags: ["rust"] }),
    sampleSnippet({ id: "3", title: "Favorite", favorite: true, tags: ["fav"] }),
  ];

  it("filters by search query", () => {
    expect(filterSnippets(snippets, "rust", null, false)).toHaveLength(1);
  });

  it("filters by tag", () => {
    expect(filterSnippets(snippets, "", "demo", false)).toHaveLength(1);
  });

  it("filters favorites only", () => {
    expect(filterSnippets(snippets, "", null, true)).toHaveLength(1);
  });
});

describe("collectTags", () => {
  it("returns sorted unique tags", () => {
    expect(collectTags([sampleSnippet(), sampleSnippet({ id: "2", tags: ["alpha"] })])).toEqual([
      "alpha",
      "demo",
      "js",
    ]);
  });
});
