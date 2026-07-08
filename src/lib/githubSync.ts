import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { LazyStore } from "@tauri-apps/plugin-store";
import { api } from "./api";
import type { AuthStatus, DeviceFlowStart, SnippetStore } from "./types";

const GIST_FILENAME = "sniplet-snippets.json";
const USER_AGENT = "Sniplet/0.1.0";
const SYNC_STORE = "sync.json";

const syncStore = new LazyStore(SYNC_STORE);

let pendingDeviceCode: string | null = null;

function clientId(): string {
  const id = import.meta.env.VITE_GITHUB_CLIENT_ID?.trim();
  if (!id) {
    throw new Error(
      "GitHub Client ID missing. Set VITE_GITHUB_CLIENT_ID in .env and rebuild the app.",
    );
  }
  return id;
}

async function httpFetch(input: string, init?: RequestInit): Promise<Response> {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  if (isTauri) {
    return tauriFetch(input, init);
  }
  return globalThis.fetch(input, init);
}

async function githubFormPost(url: string, fields: Record<string, string>): Promise<Response> {
  const body = new URLSearchParams(fields);
  return httpFetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
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

export async function startDeviceFlow(): Promise<DeviceFlowStart> {
  const response = await githubFormPost("https://github.com/login/device/code", {
    client_id: clientId(),
    scope: "gist user:email",
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to start GitHub device flow"));
  }

  const body = (await response.json()) as DeviceFlowStart;
  pendingDeviceCode = body.device_code;
  return body;
}

export async function pollDeviceFlow(): Promise<AuthStatus> {
  if (!pendingDeviceCode) {
    throw new Error("Device flow not started");
  }

  const response = await githubFormPost("https://github.com/login/oauth/access_token", {
    client_id: clientId(),
    device_code: pendingDeviceCode,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
  });

  const body = (await response.json()) as {
    access_token?: string;
    error?: string;
  };

  if (body.error === "authorization_pending" || body.error === "slow_down") {
    throw new Error("authorization_pending");
  }

  if (body.error) {
    throw new Error(body.error);
  }

  if (!body.access_token) {
    throw new Error("Missing GitHub access token");
  }

  const userResponse = await githubJsonRequest("https://api.github.com/user", body.access_token);
  if (!userResponse.ok) {
    throw new Error(await readError(userResponse, "Failed to fetch GitHub user"));
  }

  const user = (await userResponse.json()) as { login: string };
  await syncStore.set("github_token", body.access_token);
  await syncStore.set("github_username", user.login);
  await syncStore.save();

  pendingDeviceCode = null;
  return getAuthStatus();
}

export async function logout(): Promise<void> {
  await syncStore.delete("github_token");
  await syncStore.delete("gist_id");
  await syncStore.delete("github_username");
  await syncStore.delete("last_sync_at");
  await syncStore.save();
  pendingDeviceCode = null;
}

async function ensureGist(token: string): Promise<string> {
  const existing = await syncStore.get<string>("gist_id");
  if (existing) return existing;

  const store = await api.listSnippets();
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
  const store = await api.listSnippets();

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
  await api.mergeRemoteStore(remote);

  const now = new Date().toISOString();
  await syncStore.set("last_sync_at", now);
  await syncStore.save();
  return remote;
}
