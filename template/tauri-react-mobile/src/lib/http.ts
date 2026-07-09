import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { isTauri } from "./platform";

export async function httpFetch(input: string, init?: RequestInit): Promise<Response> {
  if (isTauri()) {
    return tauriFetch(input, init);
  }
  return globalThis.fetch(input, init);
}

export async function readJsonError(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return `${fallback} (${response.status})`;
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      return json.message ?? json.error ?? `${fallback}: ${text}`;
    } catch {
      return `${fallback}: ${text}`;
    }
  } catch {
    return `${fallback} (${response.status})`;
  }
}
