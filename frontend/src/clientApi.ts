import { AuthState } from "./auth";

const API_URL = "/api";

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
  themeColor?: string;
};

export type ClientPassView = {
  id: number;
  passType: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
  maxEntries?: number | null;
  remainingEntries?: number | null;
};

export type ClientDashboardView = {
  activePasses: ClientPassView[];
};

export type UpcomingBookingView = {
  bookingType: "GROUP_CLASS" | "PERSONAL_TRAINING";
  title: string;
  gymName: string;
  startsAt: string;
};

export type ClientTodaySummaryView = {
  nextBooking: UpcomingBookingView | null;
  expiringPassesIn7Days: number;
  activePasses: number;
};

export async function getClientGyms(auth: AuthState): Promise<ClientGymView[]> {
  const response = await fetch(`${API_URL}/client/gyms`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ pobraÄ‡ siĹ‚owni");
  return response.json();
}

export async function getAllGymsForClient(auth: AuthState): Promise<ClientGymView[]> {
  const response = await fetch(`${API_URL}/client/gyms/all`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ pobraÄ‡ listy siĹ‚owni");
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
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ doĹ‚Ä…czyÄ‡ do siĹ‚owni");
  return response.json();
}

export async function getClientDashboard(auth: AuthState, gymId: number): Promise<ClientDashboardView> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/dashboard`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ pobraÄ‡ panelu");
  return response.json();
}

export async function getClientPassTypes(
  auth: AuthState,
  gymId: number
): Promise<Array<{ id: number; name: string; price: number; durationDays: number; maxEntries?: number | null }>> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/pass-types`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ pobraÄ‡ oferty");
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
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ utworzyÄ‡ sesji pĹ‚atniczej");
  return response.json();
}

export async function rateClass(
  auth: AuthState,
  gymId: number,
  classId: number,
  payload: { rating: number; comment: string }
): Promise<void> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/classes/${classId}/rate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ oceniÄ‡ zajÄ™Ä‡");
}

export async function freezePass(
  auth: AuthState,
  gymId: number,
  passId: number,
  payload: { startDate: string; endDate: string }
): Promise<void> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/passes/${passId}/freeze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ zamroziÄ‡ karnetu");
}

export async function simulatePaymentOnline(
  auth: AuthState,
  gymId: number,
  payload: { passTypeId: number }
): Promise<void> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/simulate-payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseApiError(response, "BĹ‚Ä…d podczas symulacji pĹ‚atnoĹ›ci");
}

export async function downloadInvoicePdf(
  auth: AuthState,
  gymId: number,
  passId: number
): Promise<Blob> {
  const response = await fetch(`${API_URL}/client/gyms/${gymId}/passes/${passId}/invoice`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ pobraÄ‡ faktury");
  return response.blob();
}

export async function getGlobalClientStats(auth: AuthState): Promise<{ activePasses: number; workoutsThisMonth: number }> {
  const response = await fetch(`${API_URL}/client/dashboard/global-stats`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać statystyk");
  return response.json();
}

export async function getClientTodaySummary(auth: AuthState): Promise<ClientTodaySummaryView> {
  const response = await fetch(`${API_URL}/client/dashboard/today-summary`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać podsumowania dnia");
  return response.json();
}

export async function getCheckInQrToken(auth: AuthState): Promise<{ qrToken: string }> {
  const response = await fetch(`${API_URL}/client/checkin-qr-token`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!response.ok) await parseApiError(response, "Nie udaĹ‚o siÄ™ wygenerowaÄ‡ tokenu QR");
  return response.json();
}
export type TrainerProfileView = {
  id: number;
  employeeId: number;
  firstName: string;
  lastName: string;
  bio: string | null;
  specialization: string | null;
  hourlyRate: number;
};

export type PersonalTrainingView = {
  id: number;
  trainerId: number;
  trainerFirstName: string;
  trainerLastName: string;
  scheduledAt: string;
  price: number;
  isPaid: boolean;
  status: string;
};

export async function getTrainers(auth: AuthState, gymId: number): Promise<TrainerProfileView[]> {
  const response = await fetch(`/api/client/gyms/${gymId}/trainers`, {
    headers: { Authorization: "Bearer " + auth.token },
  });
  if (!response.ok) await parseApiError(response, "Nie udało się pobrać trenerów");
  return response.json();
}

export async function bookTraining(
  auth: AuthState,
  gymId: number,
  trainerId: number,
  scheduledAt: string
): Promise<void> {
  const res = await fetch(`${API_URL}/client/gyms/${gymId}/trainers/${trainerId}/book`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scheduledAt }),
  });

  if (!res.ok) {
    let err = "Błąd rezerwacji treningu";
    try {
      const data = await res.json();
      if (data.error) err = data.error;
    } catch (e) {}
    throw new Error(err);
  }
}

export interface AvailableSlotView {
  time: string;
}

export async function getAvailableSlots(
  auth: AuthState,
  gymId: number,
  trainerId: number,
  date: string
): Promise<AvailableSlotView[]> {
  const res = await fetch(`${API_URL}/client/gyms/${gymId}/trainers/${trainerId}/available-slots?date=${date}`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Błąd pobierania dostępnych slotów");
  }
  return res.json();
}

export async function getUpcomingTrainings(auth: AuthState): Promise<PersonalTrainingView[]> {
  const response = await fetch(`/api/client/trainings`, {
    headers: { Authorization: "Bearer " + auth.token },
  });
  if (!response.ok) return [];
  return response.json();
}

export interface ScheduleSlotView {
  time: string;
  available: boolean;
}

export interface TrainerScheduleDayView {
  date: string;
  slots: ScheduleSlotView[];
}

export async function getTrainerSchedule(
  auth: AuthState,
  gymId: number,
  trainerId: number
): Promise<TrainerScheduleDayView[]> {
  const res = await fetch(`${API_URL}/client/gyms/${gymId}/trainers/${trainerId}/schedule`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) throw new Error("Błąd pobierania terminarza");
  return res.json();
}

export async function cancelTraining(auth: AuthState, gymId: number, trainingId: number): Promise<void> {
  const res = await fetch(`${API_URL}/client/gyms/${gymId}/trainings/${trainingId}/cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok) throw new Error("Błąd anulowania treningu");
}
