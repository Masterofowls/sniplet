import { LazyStore } from "@tauri-apps/plugin-store";

const stores = new Map<string, LazyStore>();

export function getStore(fileName: string): LazyStore {
  let store = stores.get(fileName);
  if (!store) {
    store = new LazyStore(fileName);
    stores.set(fileName, store);
  }
  return store;
}

export async function loadJson<T>(fileName: string, key: string, fallback: T): Promise<T> {
  const store = getStore(fileName);
  const value = await store.get<T>(key);
  return value ?? fallback;
}

export async function saveJson<T>(fileName: string, key: string, value: T): Promise<T> {
  const store = getStore(fileName);
  await store.set(key, value);
  await store.save();
  return value;
}

export async function clearStore(fileName: string): Promise<void> {
  const store = getStore(fileName);
  await store.clear();
  await store.save();
}
