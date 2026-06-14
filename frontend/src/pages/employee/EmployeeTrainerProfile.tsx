import { useEffect, useState, useMemo } from "react";
import type { EmployeeContext } from "./types";
import { getTrainerProfile, updateTrainerProfile, getTrainerTrainings, cancelTrainerTraining } from "../../api";
import { Save, User, Calendar, CheckCircle } from "lucide-react";
import { FormSection } from "../../components/FormSection";
import { PageHeader } from "../../components/PageHeader";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import { WeekCalendar } from "../../components/calendar/WeekCalendar";
import { getWeekStart, defaultNewEventTimes } from "../../components/calendar/calendarUtils";
import { TrainerAvailabilityModal, type TrainerAvailabilityPayload } from "../../components/calendar/TrainerAvailabilityModal";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function EmployeeTrainerProfile({ ctx }: { ctx: EmployeeContext }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [modal, setModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    eventId: string | null;
    initialValues: TrainerAvailabilityPayload;
  }>({
    open: false,
    mode: "create",
    eventId: null,
    initialValues: { startAt: "", endAt: "", slotDurationMinutes: 60 },
  });

  useEffect(() => {
    loadData();
  }, [ctx.selectedGymId]);

  async function loadData() {
    if (!ctx.selectedGymId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getTrainerProfile(ctx.auth, Number(ctx.selectedGymId));
      
      // Assign fake IDs to availabilities so they work with calendar drag and drop
      if (data.availabilities) {
        data.availabilities = data.availabilities.map((a: any) => ({
          ...a,
          _tempId: a.id ? String(a.id) : generateId(),
        }));
      }
      setProfile(data);

      const tData = await getTrainerTrainings(ctx.auth, Number(ctx.selectedGymId));
      setTrainings(tData);
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd podczas ładowania profilu");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelTraining(trainingId: number) {
    if (!ctx.selectedGymId) return;
    if (!confirm("Czy na pewno chcesz odwołać ten trening?")) return;
    try {
      await cancelTrainerTraining(ctx.auth, Number(ctx.selectedGymId), trainingId);
      setSuccess("Trening został odwołany.");
      setTimeout(() => setSuccess(""), 3000);
      const tData = await getTrainerTrainings(ctx.auth, Number(ctx.selectedGymId));
      setTrainings(tData);
    } catch (err: any) {
      setError(err.message || "Błąd podczas odwoływania treningu");
    }
  }

  // Map profile.availabilities to WeekCalendar events
  const calendarEvents = useMemo(() => {
    if (!profile?.availabilities) return [];
    return profile.availabilities.map((a: any) => ({
      id: a._tempId,
      title: `${a.slotDurationMinutes || 60} min`,
      startAt: `${a.date}T${a.startTime}`,
      endAt: `${a.date}T${a.endTime}`,
      color: "emerald",
      canEdit: true,
      original: a,
    }));
  }, [profile?.availabilities]);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!profile || !ctx.selectedGymId) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payloadAvailabilities = profile.availabilities.map((a: any) => ({
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        slotDurationMinutes: a.slotDurationMinutes || 60,
      }));

      const data = await updateTrainerProfile(ctx.auth, Number(ctx.selectedGymId), {
        bio: profile.bio,
        specialization: profile.specialization,
        hourlyRate: profile.hourlyRate,
        availabilities: payloadAvailabilities,
      });

      if (data.availabilities) {
        data.availabilities = data.availabilities.map((a: any) => ({
          ...a,
          _tempId: a.id ? String(a.id) : generateId(),
        }));
      }
      setProfile(data);
      setSuccess("Profil i terminarz zostały zapisane!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Błąd zapisu profilu");
    } finally {
      setSaving(false);
    }
  }

  function handleSlotClick(day: Date, slotIndex: number) {
    const defaults = defaultNewEventTimes(day, slotIndex);
    setModal({
      open: true,
      mode: "create",
      eventId: null,
      initialValues: {
        startAt: defaults.startAt,
        endAt: defaults.endAt,
        slotDurationMinutes: 60,
      },
    });
  }

  function handleEventClick(event: any) {
    setModal({
      open: true,
      mode: "edit",
      eventId: event.id,
      initialValues: {
        startAt: event.startAt,
        endAt: event.endAt,
        slotDurationMinutes: event.original.slotDurationMinutes || 60,
      },
    });
  }

  async function handleEventMove(event: any, newStartAt: string, newEndAt: string) {
    const newAvails = profile.availabilities.map((a: any) => {
      if (a._tempId === event.id) {
        return {
          ...a,
          date: newStartAt.split("T")[0],
          startTime: newStartAt.split("T")[1],
          endTime: newEndAt.split("T")[1],
        };
      }
      return a;
    });
    setProfile({ ...profile, availabilities: newAvails });
  }

  function handleModalSave(payload: TrainerAvailabilityPayload) {
    const date = payload.startAt.split("T")[0];
    const startTime = payload.startAt.split("T")[1];
    let endTime = payload.endAt.split("T")[1];
    
    // If end date is different from start date, clamp to 23:59:00 to keep it single-day
    const endDate = payload.endAt.split("T")[0];
    if (endDate !== date) {
      endTime = "23:59:00";
    }

    if (modal.mode === "create") {
      const newAvail = {
        _tempId: generateId(),
        date,
        startTime,
        endTime,
        slotDurationMinutes: payload.slotDurationMinutes,
      };
      setProfile({ ...profile, availabilities: [...profile.availabilities, newAvail] });
    } else {
      const newAvails = profile.availabilities.map((a: any) => {
        if (a._tempId === modal.eventId) {
          return {
            ...a,
            date,
            startTime,
            endTime,
            slotDurationMinutes: payload.slotDurationMinutes,
          };
        }
        return a;
      });
      setProfile({ ...profile, availabilities: newAvails });
    }
  }

  function handleModalDelete() {
    if (!modal.eventId) return;
    const newAvails = profile.availabilities.filter((a: any) => a._tempId !== modal.eventId);
    setProfile({ ...profile, availabilities: newAvails });
  }

  if (!ctx.selectedGymId) return <SelectGymDashboardPrompt />;

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );

  if (error && !profile)
    return (
      <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 text-rose-600 dark:text-rose-400 text-sm font-medium">
        {error}
      </div>
    );

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Profil Trenera"
        subtitle="Zarządzaj swoją wizytówką i terminarzem dostępności dla klientów."
      />

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 text-rose-600 dark:text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormSection
            title="Informacje ogólne"
            description="Twoja wizytówka widoczna dla klientów szukających trenera."
          >
            <div className="space-y-5">
              <div>
                <label className={labelClassName}>
                  <User className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
                  Specjalizacja
                </label>
                <input
                  type="text"
                  value={profile.specialization ?? ""}
                  onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  className={inputClassName}
                  placeholder="np. Trening siłowy, Odchudzanie"
                />
              </div>
              <div>
                <label className={labelClassName}>Bio</label>
                <textarea
                  value={profile.bio ?? ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className={inputClassName}
                  placeholder="Opowiedz o swoim doświadczeniu..."
                  rows={5}
                />
              </div>
              <div>
                <label className={labelClassName}>Stawka godzinowa (PLN)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profile.hourlyRate ?? 0}
                  onChange={(e) => setProfile({ ...profile, hourlyRate: parseFloat(e.target.value) })}
                  className={inputClassName}
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Nadchodzące treningi"
            description="Treningi zarezerwowane przez Twoich klientów."
          >
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {trainings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                  <Calendar className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nie masz żadnych nadchodzących treningów</p>
                </div>
              ) : (
                trainings.map((t, i) => {
                  const date = new Date(t.scheduledAt);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/30 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {t.clientFirstName} {t.clientLastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {date.toLocaleDateString("pl-PL", { weekday: "short", month: "short", day: "numeric" })}
                            {" · "}
                            {date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                          {t.status === "SCHEDULED" ? "Zaplanowany" : t.status}
                        </span>
                        {t.status === "SCHEDULED" && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => handleCancelTraining(t.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-500 hover:underline"
                            >
                              Odwołaj
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </FormSection>
        </div>

        <FormSection
          title="Terminarz dostępności"
          description="Zaznacz na grafiku godziny, w których jesteś dostępny. Pamiętaj, aby po wszystkim kliknąć 'Zapisz profil i terminarz' na dole ekranu."
        >
          <div className="-mx-2 sm:mx-0">
            <WeekCalendar
              events={calendarEvents}
              weekStart={weekStart}
              onWeekChange={setWeekStart}
              onSlotClick={handleSlotClick}
              onEventClick={handleEventClick}
              onEventMove={handleEventMove}
              onAddClick={() => {
                const now = new Date();
                const day = new Date(now);
                day.setHours(0, 0, 0, 0);
                const minutesFromStart = (now.getHours() - 6) * 60 + now.getMinutes();
                const slotIndex = Math.max(0, Math.min(Math.floor(minutesFromStart / 30), 31));
                handleSlotClick(day, slotIndex);
              }}
            />
          </div>
        </FormSection>

        <button type="submit" disabled={saving} className={primaryButtonClassName}>
          <Save className="w-4 h-4" />
          {saving ? "Zapisywanie..." : "Zapisz profil i terminarz"}
        </button>
      </form>

      <TrainerAvailabilityModal
        open={modal.open}
        mode={modal.mode}
        initialValues={modal.initialValues}
        onClose={() => setModal({ ...modal, open: false })}
        onSave={handleModalSave}
        onDelete={modal.mode === "edit" ? handleModalDelete : undefined}
      />
    </div>
  );
}
