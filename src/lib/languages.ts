export const LANGUAGES = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "tsx", label: "TSX" },
  { id: "jsx", label: "JSX" },
  { id: "rust", label: "Rust" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "kotlin", label: "Kotlin" },
  { id: "go", label: "Go" },
  { id: "csharp", label: "C#" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "sql", label: "SQL" },
  { id: "json", label: "JSON" },
  { id: "yaml", label: "YAML" },
  { id: "bash", label: "Bash" },
  { id: "shell", label: "Shell" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "markdown", label: "Markdown" },
  { id: "plaintext", label: "Plain Text" },
] as const;

export function languageLabel(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

export function detectLanguage(code: string): string {
  const trimmed = code.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* not json */
    }
  }
  if (/^(import|export|const|let|function|interface|type)\s/m.test(trimmed)) {
    if (/\.tsx?/.test(trimmed) || trimmed.includes("React")) return "tsx";
    return "typescript";
  }
  if (/^(fn |use |impl |pub |struct |enum )/m.test(trimmed)) return "rust";
  if (/^(def |import |class |from )/m.test(trimmed)) return "python";
  if (/^(package |public class |import java)/m.test(trimmed)) return "java";
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)/im.test(trimmed)) return "sql";
  if (/^#!\/bin\/(ba)?sh/.test(trimmed)) return "bash";
  return "plaintext";
}
