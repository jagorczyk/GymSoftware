export function gymNameToSubdomain(gymName: string): string {
  const base = gymName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "gym";
}

export function getDomainPreview(subdomain: string): string {
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : "";

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${subdomain}.localhost${port}`;
  }

  if (hostname === "gymlos.pl" || hostname === "www.gymlos.pl") {
    return `${subdomain}.gymlos.pl`;
  }

  const root = hostname.includes("localhost") ? `localhost${port}` : "gymlos.pl";
  return `${subdomain}.${root}`;
}

export const POSTAL_CODE_REGEX = /^\d{2}-\d{3}$/;
export const ADDRESS_REGEX = /^(?=.*[A-Za-zÀ-žĄĆĘŁŃÓŚŹŻąćęłńóśźż]).{4,}$/;

export function formatPostalCodeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 5);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

export function validatePostalCode(value: string): string | null {
  if (!POSTAL_CODE_REGEX.test(value)) return "Kod pocztowy musi mieć format 00-000";
  return null;
}

export function validateAddress(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 5) return "Adres musi mieć co najmniej 5 znaków";
  if (!ADDRESS_REGEX.test(trimmed)) return "Podaj pełny adres z nazwą ulicy";
  return null;
}
