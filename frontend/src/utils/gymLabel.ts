type GymLabelInput = {
  name: string;
  address?: string | null;
  city?: string | null;
};

function isPlaceholder(value?: string | null): boolean {
  const trimmed = value?.trim();
  return !trimmed || trimmed === "-";
}

export function formatGymAddressLine(gym: GymLabelInput): string | null {
  const parts = [gym.address, gym.city]
    .map((value) => value?.trim())
    .filter((value): value is string => !!value && !isPlaceholder(value));

  return parts.length > 0 ? parts.join(", ") : null;
}

export function formatGymOptionLabel(gym: GymLabelInput): string {
  const addressLine = formatGymAddressLine(gym);
  if (addressLine) return `${gym.name} — ${addressLine}`;
  return gym.name;
}
