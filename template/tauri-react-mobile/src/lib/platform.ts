export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function isAndroid(): boolean {
  if (!isTauri()) return false;
  return /android/i.test(navigator.userAgent);
}
