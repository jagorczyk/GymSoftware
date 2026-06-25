export type PassTypeLike = {
  durationDays: number;
  maxEntries?: number | null;
};

export function formatPassTypeValidity(passType: PassTypeLike): string {
  if (passType.maxEntries != null) {
    const entries =
      passType.maxEntries === 1 ? "1 wejście" : `${passType.maxEntries} wejść`;
    return `${entries} • ważny ${passType.durationDays} dni od zakupu`;
  }
  if (passType.durationDays === 1) {
    return "1 dzień • nielimitowane wejścia w ciągu dnia";
  }
  return `${passType.durationDays} dni • nielimitowane wejścia`;
}

export function formatPassRemaining(pass: {
  maxEntries?: number | null;
  remainingEntries?: number | null;
}): string | null {
  if (pass.maxEntries == null) return null;
  const remaining = pass.remainingEntries ?? 0;
  if (remaining === 1) return "Pozostało 1 wejście";
  return `Pozostało ${remaining} wejść`;
}
