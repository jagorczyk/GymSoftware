const TRAINING_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Potwierdzony",
  PENDING: "Oczekuje",
  CANCELLED: "Anulowany",
  COMPLETED: "Zakończony",
};

export function formatTrainingStatus(status: string): string {
  return TRAINING_STATUS_LABELS[status] ?? status;
}
