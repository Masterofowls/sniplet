import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { LazyStore } from "@tauri-apps/plugin-store";
import * as storage from "./snippetStorage";
import type { AuthStatus, SnippetStore } from "./types";

const GIST_FILENAME = "sniplet-snippets.json";
const USER_AGENT = "Sniplet/0.1.0";
const SYNC_STORE = "sync.json";

const syncStore = new LazyStore(SYNC_STORE);

async function httpFetch(input: string, init?: RequestInit): Promise<Response> {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (isTauri) {
    return tauriFetch(input, init);
  }
  return globalThis.fetch(input, init);
}

async function githubJsonRequest(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("User-Agent", USER_AGENT);
  headers.set("Authorization", `Bearer ${token}`);
  return httpFetch(url, { ...init, headers });
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return `${fallback} (${response.status})`;
    try {
      const json = JSON.parse(text) as {
        message?: string;
        error?: string;
        error_description?: string;
      };
      return json.message ?? json.error_description ?? json.error ?? `${fallback}: ${text}`;
    } catch {
      return `${fallback}: ${text}`;
    }
  } catch {
    return `${fallback} (${response.status})`;
  }
}

async function getToken(): Promise<string | null> {
  const token = await syncStore.get<string>("github_token");
  return token ?? null;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  const token = await getToken();
  const username = await syncStore.get<string>("github_username");
  const gistId = await syncStore.get<string>("gist_id");
  const lastSyncAt = await syncStore.get<string>("last_sync_at");
  return {
    authenticated: Boolean(token),
    username: username ?? null,
    gist_id: gistId ?? null,
    last_sync_at: lastSyncAt ?? null,
  };
}

export async function connectWithToken(token: string): Promise<AuthStatus> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("Enter a GitHub personal access token");
  }

  const userResponse = await githubJsonRequest("https://api.github.com/user", trimmed);
  if (!userResponse.ok) {
    throw new Error(await readError(userResponse, "Invalid GitHub token"));
  }

  const user = (await userResponse.json()) as { login: string };
  await syncStore.set("github_token", trimmed);
  await syncStore.set("github_username", user.login);
  await syncStore.save();
  return getAuthStatus();
}

export async function logout(): Promise<void> {
  await syncStore.delete("github_token");
  await syncStore.delete("gist_id");
  await syncStore.delete("github_username");
  await syncStore.delete("last_sync_at");
  await syncStore.save();
}

async function ensureGist(token: string): Promise<string> {
  const existing = await syncStore.get<string>("gist_id");
  if (existing) return existing;

  const store = await storage.loadStore();
  const response = await githubJsonRequest("https://api.github.com/gists", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Sniplet snippet sync",
      public: false,
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(store, null, 2) },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to create GitHub Gist"));
  }

  const gist = (await response.json()) as { id: string };
  const now = new Date().toISOString();
  await syncStore.set("gist_id", gist.id);
  await syncStore.set("last_sync_at", now);
  await syncStore.save();
  return gist.id;
}

export async function pushSync(): Promise<AuthStatus> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const gistId = await ensureGist(token);
  const store = await storage.loadStore();

  const response = await githubJsonRequest(`https://api.github.com/gists/${gistId}`, token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(store, null, 2) },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to push sync"));
  }

  const now = new Date().toISOString();
  await syncStore.set("last_sync_at", now);
  await syncStore.save();
  return getAuthStatus();
}

export async function pullSync(): Promise<SnippetStore> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated with GitHub");

  const gistId = await ensureGist(token);
  const response = await githubJsonRequest(`https://api.github.com/gists/${gistId}`, token);

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to pull sync"));
  }

  const gist = (await response.json()) as {
    files: Record<string, { content?: string }>;
  };

  const content = gist.files[GIST_FILENAME]?.content;
  if (!content) {
    throw new Error("Gist sync file missing");
  }

  const remote = JSON.parse(content) as SnippetStore;
  const merged = await storage.mergeRemoteStore(remote);

  const now = new Date().toISOString();
  await syncStore.set("last_sync_at", now);
  await syncStore.save();
  return merged;
}
