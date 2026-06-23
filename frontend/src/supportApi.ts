import { AuthState } from "./auth";

const API_URL = "/api";

export type SupportMessageView = {
  id: number;
  senderUserId: number;
  senderName: string;
  senderSide: "CLIENT" | "STAFF";
  body: string;
  createdAt: string;
};

export type SupportThreadSummary = {
  id: number;
  gymId: number;
  gymName: string;
  guestId: number;
  guestName: string;
  guestEmail: string | null;
  subject: string;
  status: "OPEN" | "CLOSED";
  lastMessagePreview: string;
  updatedAt: string;
  unreadCount: number;
};

export type SupportThreadDetail = {
  id: number;
  gymId: number;
  gymName: string;
  guestId: number;
  guestName: string;
  guestEmail: string | null;
  subject: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  messages: SupportMessageView[];
};

async function parseApiError(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) {
    window.dispatchEvent(new Event("jwt_expired"));
  }
  let message = fallback;
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.length > 0) {
      message = body.error;
    }
  } catch {
    // ignore
  }
  throw new Error(message);
}

export type StaffSupportApi = {
  listThreads: (gymId: number) => Promise<SupportThreadSummary[]>;
  getThread: (gymId: number, threadId: number) => Promise<SupportThreadDetail>;
  reply: (gymId: number, threadId: number, body: string) => Promise<SupportThreadDetail>;
  closeThread: (gymId: number, threadId: number) => Promise<SupportThreadDetail>;
  reopenThread: (gymId: number, threadId: number) => Promise<SupportThreadDetail>;
};

export function createOwnerSupportApi(auth: AuthState): StaffSupportApi {
  const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
  const base = (gymId: number) => `${API_URL}/owner/gyms/${gymId}/support`;

  return {
    async listThreads(gymId) {
      const res = await fetch(`${base(gymId)}/threads`, { headers: { Authorization: headers.Authorization } });
      if (!res.ok) await parseApiError(res, "Nie udało się pobrać wiadomości");
      return res.json();
    },
    async getThread(gymId, threadId) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}`, { headers: { Authorization: headers.Authorization } });
      if (!res.ok) await parseApiError(res, "Nie udało się otworzyć rozmowy");
      return res.json();
    },
    async reply(gymId, threadId, body) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body }),
      });
      if (!res.ok) await parseApiError(res, "Nie udało się wysłać odpowiedzi");
      return res.json();
    },
    async closeThread(gymId, threadId) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}/close`, {
        method: "POST",
        headers: { Authorization: headers.Authorization },
      });
      if (!res.ok) await parseApiError(res, "Nie udało się zamknąć rozmowy");
      return res.json();
    },
    async reopenThread(gymId, threadId) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}/reopen`, {
        method: "POST",
        headers: { Authorization: headers.Authorization },
      });
      if (!res.ok) await parseApiError(res, "Nie udało się ponownie otworzyć rozmowy");
      return res.json();
    },
  };
}

export function createEmployeeSupportApi(auth: AuthState): StaffSupportApi {
  const headers = { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
  const base = (gymId: number) => `${API_URL}/employee/gyms/${gymId}/support`;

  return {
    async listThreads(gymId) {
      const res = await fetch(`${base(gymId)}/threads`, { headers: { Authorization: headers.Authorization } });
      if (!res.ok) await parseApiError(res, "Nie udało się pobrać wiadomości");
      return res.json();
    },
    async getThread(gymId, threadId) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}`, { headers: { Authorization: headers.Authorization } });
      if (!res.ok) await parseApiError(res, "Nie udało się otworzyć rozmowy");
      return res.json();
    },
    async reply(gymId, threadId, body) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body }),
      });
      if (!res.ok) await parseApiError(res, "Nie udało się wysłać odpowiedzi");
      return res.json();
    },
    async closeThread(gymId, threadId) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}/close`, {
        method: "POST",
        headers: { Authorization: headers.Authorization },
      });
      if (!res.ok) await parseApiError(res, "Nie udało się zamknąć rozmowy");
      return res.json();
    },
    async reopenThread(gymId, threadId) {
      const res = await fetch(`${base(gymId)}/threads/${threadId}/reopen`, {
        method: "POST",
        headers: { Authorization: headers.Authorization },
      });
      if (!res.ok) await parseApiError(res, "Nie udało się ponownie otworzyć rozmowy");
      return res.json();
    },
  };
}

export async function getClientSupportThreads(auth: AuthState): Promise<SupportThreadSummary[]> {
  const res = await fetch(`${API_URL}/client/support/threads`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) await parseApiError(res, "Nie udało się pobrać wiadomości");
  return res.json();
}

export async function createClientSupportThread(
  auth: AuthState,
  gymId: number,
  payload: { subject: string; body: string }
): Promise<SupportThreadDetail> {
  const res = await fetch(`${API_URL}/client/gyms/${gymId}/support/threads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await parseApiError(res, "Nie udało się wysłać wiadomości");
  return res.json();
}

export async function getClientSupportThread(
  auth: AuthState,
  gymId: number,
  threadId: number
): Promise<SupportThreadDetail> {
  const res = await fetch(`${API_URL}/client/gyms/${gymId}/support/threads/${threadId}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) await parseApiError(res, "Nie udało się otworzyć rozmowy");
  return res.json();
}

export async function replyToClientSupportThread(
  auth: AuthState,
  gymId: number,
  threadId: number,
  body: string
): Promise<SupportThreadDetail> {
  const res = await fetch(`${API_URL}/client/gyms/${gymId}/support/threads/${threadId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) await parseApiError(res, "Nie udało się wysłać wiadomości");
  return res.json();
}

export function formatSupportDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function getOwnerSupportUnreadCount(auth: AuthState, gymId: number): Promise<number> {
  const res = await fetch(`${API_URL}/owner/gyms/${gymId}/support/unread-count`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data.count ?? 0);
}

export async function getEmployeeSupportUnreadCount(auth: AuthState, gymId: number): Promise<number> {
  const res = await fetch(`${API_URL}/employee/gyms/${gymId}/support/unread-count`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data.count ?? 0);
}

export const SUPPORT_INBOX_UPDATED_EVENT = "support_inbox_updated";
