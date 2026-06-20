export const getSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  
  if (hostname === "localhost" || hostname === "gymlos.pl" || hostname === "www.gymlos.pl" || hostname === "127.0.0.1") {
    return null;
  }

  // e.g. "gymslim.gymlos.pl" or "gymslim.localhost"
  const parts = hostname.split(".");
  if (parts.length > 2 || (parts.length === 2 && hostname.includes("localhost"))) {
    return parts[0];
  }

  return null;
};
