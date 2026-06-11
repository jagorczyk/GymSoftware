import { describe, expect, it } from "vitest";
import { decodeRoleFromJwt } from "./auth";

function fakeToken(role: "OWNER" | "EMPLOYEE"): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ role }));
  return `${header}.${payload}.x`;
}

describe("auth helpers", () => {
  it("decodes OWNER role from jwt payload", () => {
    expect(decodeRoleFromJwt(fakeToken("OWNER"))).toBe("OWNER");
  });
});
