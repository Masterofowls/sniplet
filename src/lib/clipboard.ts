import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";

export async function readClipboard(): Promise<string> {
  const text = await readText();
  return text ?? "";
}

export async function writeClipboard(content: string): Promise<void> {
  await writeText(content);
}
