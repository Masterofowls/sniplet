import { describe, expect, it } from "vitest";
import { isAndroid, isTauri } from "../lib/platform";

describe("platform", () => {
  it("detects non-tauri test environment", () => {
    expect(isTauri()).toBe(false);
    expect(isAndroid()).toBe(false);
  });
});
