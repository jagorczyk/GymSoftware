import { AuthState } from "./auth";

const API_URL = "http://localhost:8080/api";

async function parseApiError(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) {
    window.dispatchEvent(new Event("jwt_expired"));
  }
  let message = fallback;
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.length > 0) {
      message = body.error;
    } else if (typeof body?.detail === "string" && body.detail.length > 0) {
      message = body.detail;
    } else if (typeof body?.message === "string" && body.message.length > 0) {
      message = body.message;
    }
  } catch {
    // response body is not JSON
  }
  throw new Error(message);
}

export type ClientGymView = {
  id: number;
  name: string;
  address: string;
};

export type ClientPassView = {
  id: number;
  passType: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
};

export type ClientDashboardView = {
  activePasses: ClientPassView[];
};

export async function getClientGyms(auth: AuthState): Promise<ClientGymView[]> {
  const response = await fetch(`${API_URL}/client/gyms`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać siłowni");
  return response.json();
}

export async function getAllGymsForClient(auth: AuthState): Promise<ClientGymView[]> {
  const response = await fetch(`${API_URL}/client/gyms/all`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać listy siłowni");
  return response.json();
}

export async function joinGym(
  auth: AuthState,
  payload: { gymId: number; firstName: string; lastName: string; phone: string }
): Promise<ClientGymView> {
  const response = await fetch(`${API_URL}/client/gyms/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się dołączyć do siłowni");
  return response.json();
}

export async function getClientDashboard(auth: AuthState, gymId: number): Promise<ClientDashboardView> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/dashboard`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać panelu");
  return response.json();
}

export async function getClientPassTypes(
  auth: AuthState,
  gymId: number
): Promise<Array<{ id: number; name: string; price: number; durationDays: number }>> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/pass-types`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać oferty");
  return response.json();
}

export async function purchasePassOnline(
  auth: AuthState,
  gymId: number,
  payload: { passTypeId: number }
): Promise<{ checkoutUrl: string }> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/purchase-pass`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udało się utworzyć sesji płatniczej");
  return response.json();
}
