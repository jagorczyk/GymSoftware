import { beforeEach, describe, expect, it } from "vitest";
import { decodeRoleFromJwt, getAuthCookieDomain, loadAuth, saveAuth, clearAuth } from "./auth";

function fakeToken(role: "OWNER" | "EMPLOYEE"): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ role }));
  return `${header}.${payload}.x`;
}

describe("auth helpers", () => {
  beforeEach(() => {
    clearAuth();
    localStorage.clear();
    document.cookie = "gym_auth=; path=/; max-age=0";
  });

  it("decodes OWNER role from jwt payload", () => {
    expect(decodeRoleFromJwt(fakeToken("OWNER"))).toBe("OWNER");
  });

  it("stores auth in cookie and loads it back", () => {
    saveAuth({ token: fakeToken("OWNER"), role: "OWNER", email: "owner@test.com" });
    const loaded = loadAuth();
    expect(loaded?.role).toBe("OWNER");
    expect(loaded?.email).toBe("owner@test.com");
    expect(document.cookie).toContain("gym_auth=");
  });

  it("resolves cookie domain for gymlos.pl hosts", () => {
    Object.defineProperty(window, "location", {
      value: { hostname: "fitness.gymlos.pl", protocol: "https:" },
      writable: true,
    });
    expect(getAuthCookieDomain()).toBe(".gymlos.pl");
  });
});
