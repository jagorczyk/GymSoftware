import { useEffect, useState, useMemo } from "react";
import type { EmployeeContext } from "./types";
import { getTrainerProfile, updateTrainerProfile, getTrainerTrainings, cancelTrainerTraining } from "../../api";
import { Save, User, Calendar, CheckCircle } from "lucide-react";
import { FormSection } from "../../components/FormSection";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/LoadingState";
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

  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    if (profile?.availabilities) {
      profile.availabilities.forEach((a: any) => {
        events.push({
          id: a._tempId,
          title: `${a.slotDurationMinutes || 60} min`,
          startAt: `${a.date}T${a.startTime}`,
          endAt: `${a.date}T${a.endTime}`,
          color: "emerald",
          canEdit: true,
          original: a,
          isTraining: false,
        });
      });
    }

    if (trainings) {
      trainings.forEach((t: any) => {
        const dateStr = t.scheduledAt.split("T")[0];
        const timeStr = t.scheduledAt.split("T")[1];
        
        let durationMinutes = 60;
        const avail = profile?.availabilities?.find((a: any) => a.date === dateStr && a.startTime <= timeStr && a.endTime > timeStr);
        if (avail?.slotDurationMinutes) {
          durationMinutes = avail.slotDurationMinutes;
        }

        const startD = new Date(t.scheduledAt);
        const endD = new Date(startD.getTime() + durationMinutes * 60000);

        const pad = (n: number) => n.toString().padStart(2, "0");
        const endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}T${pad(endD.getHours())}:${pad(endD.getMinutes())}:00`;

        events.push({
          id: `training-${t.id}`,
          title: `Zajęte: ${t.clientFirstName} ${t.clientLastName}`,
          startAt: t.scheduledAt,
          endAt: endStr,
          color: "rose",
          canEdit: false,
          original: t,
          isTraining: true,
        });
      });
    }
    return events;
  }, [profile?.availabilities, trainings]);

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
    if (event.isTraining) {
      handleCancelTraining(event.original.id);
      return;
    }
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

  if (loading) return <LoadingState message="Ładowanie profilu trenera..." />;

  if (error && !profile)
    return (
      <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-4 text-rose-600 dark:text-rose-400 text-sm font-medium">
        {error}
      </div>
    );

  if (!profile) return null;

  return (
    <div className="space-y-6">
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

          {/* Usunięto listę nadchodzących treningów, od teraz są widoczne na kalendarzu */}
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
