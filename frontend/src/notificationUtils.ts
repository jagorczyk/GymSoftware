/** Ensures user-facing notification text ends with a sentence period. */
export function ensureSentenceEnd(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;
  if (/[.!?…]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}
