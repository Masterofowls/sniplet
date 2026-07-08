export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface SnippetStore {
  version: number;
  snippets: Snippet[];
  updated_at?: string | null;
}

export interface AuthStatus {
  authenticated: boolean;
  username?: string | null;
  gist_id?: string | null;
  last_sync_at?: string | null;
}

export interface DeviceFlowStart {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface SnippetDraft {
  title: string;
  code: string;
  language: string;
  tags: string[];
  favorite?: boolean;
}
