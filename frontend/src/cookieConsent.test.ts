import { beforeEach, describe, expect, it } from "vitest";
import { getConsent, hasConsent, setConsent } from "./cookieConsent";

describe("cookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "gym_cookie_consent=; path=/; max-age=0";
  });

  it("returns null when no consent stored", () => {
    expect(getConsent()).toBeNull();
    expect(hasConsent()).toBe(false);
  });

  it("persists accepted consent in localStorage and cookie", () => {
    setConsent("accepted");
    expect(getConsent()).toBe("accepted");
    expect(hasConsent()).toBe(true);
    expect(document.cookie).toContain("gym_cookie_consent=accepted");
  });

  it("persists rejected consent", () => {
    setConsent("rejected");
    expect(getConsent()).toBe("rejected");
    expect(hasConsent()).toBe(false);
  });

  it("reads consent from cookie when localStorage is empty", () => {
    document.cookie = "gym_cookie_consent=rejected; path=/";
    expect(getConsent()).toBe("rejected");
  });
});
