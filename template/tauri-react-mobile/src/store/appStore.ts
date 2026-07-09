import { create } from "zustand";
import { loadJson, saveJson } from "../lib/storage";

const APP_STORE_FILE = "app.json";
const APP_STATE_KEY = "state";

export interface AppState {
  ready: boolean;
  hydrated: boolean;
  /** Replace with your domain fields */
  notes: string;
}

interface AppStore extends AppState {
  hydrate: () => Promise<void>;
  setNotes: (notes: string) => Promise<void>;
  reset: () => Promise<void>;
}

const defaultState: AppState = {
  ready: false,
  hydrated: false,
  notes: "",
};

export const useAppStore = create<AppStore>((set) => ({
  ...defaultState,

  hydrate: async () => {
    const saved = await loadJson<Pick<AppState, "notes">>(APP_STORE_FILE, APP_STATE_KEY, {
      notes: "",
    });
    set({ ...saved, ready: true, hydrated: true });
  },

  setNotes: async (notes) => {
    await saveJson(APP_STORE_FILE, APP_STATE_KEY, { notes });
    set({ notes });
  },

  reset: async () => {
    await saveJson(APP_STORE_FILE, APP_STATE_KEY, { notes: "" });
    set({ notes: "" });
  },
}));
