export const PLACEHOLDER_GYM_NAME = "Twoja Siłownia (Tymczasowa)";

export type GymOnboardingInfo = {
  id: number;
  name: string;
  address?: string | null;
};

export function isPlaceholderGymName(name: string): boolean {
  return name === PLACEHOLDER_GYM_NAME;
}

export function needsGymOnboarding(gym: GymOnboardingInfo): boolean {
  return isPlaceholderGymName(gym.name) || gym.address === "-";
}

export function findGymNeedingOnboarding<T extends GymOnboardingInfo>(gyms: T[]): T | null {
  return gyms.find(needsGymOnboarding) ?? null;
}
