import { describe, expect, it } from "vitest";
import { APP_NAME } from "./appInfo";

describe("appInfo", () => {
  it("exposes the app name", () => {
    expect(APP_NAME).toBe("P152");
  });
});
