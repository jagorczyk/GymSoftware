import { describe, expect, it } from "vitest";
import { ensureSentenceEnd } from "./notificationUtils";

describe("ensureSentenceEnd", () => {
  it("adds period when missing", () => {
    expect(ensureSentenceEnd("Dodano pracownika")).toBe("Dodano pracownika.");
  });

  it("keeps existing punctuation", () => {
    expect(ensureSentenceEnd("Czy na pewno?")).toBe("Czy na pewno?");
    expect(ensureSentenceEnd("Gotowe!")).toBe("Gotowe!");
  });
});
