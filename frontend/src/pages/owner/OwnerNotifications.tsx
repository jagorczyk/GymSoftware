import { FormEvent, useEffect, useState } from "react";
import {
  getNotificationSettings,
  getNotifications,
  markNotificationRead,
  updateNotificationSettings,
  type GymNotification,
  type NotificationSettings,
} from "../../api";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { LoadingState } from "../../components/LoadingState";
import { FormSection } from "../../components/FormSection";
import { inputClassName, labelClassName, primaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerNotifications({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, setError, setInfo } = ctx;
  const [notifications, setNotifications] = useState<GymNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!selectedGymId) return;
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        getNotifications(auth, Number(selectedGymId)),
        getNotificationSettings(auth, Number(selectedGymId)),
      ]);
      setNotifications(list);
      setSettings(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać powiadomień");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGymId]);

  async function onMarkRead(id: number) {
    if (!selectedGymId) return;
    await markNotificationRead(auth, Number(selectedGymId), id);
    await load();
  }

  async function onSaveSettings(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId || !settings) return;
    try {
      await updateNotificationSettings(auth, Number(selectedGymId), settings);
      setInfo("Zapisano ustawienia powiadomień");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać ustawień");
    }
  }

  if (!selectedGymId) return <SelectGymPrompt />;
  if (loading) return <LoadingState message="Ładowanie powiadomień..." />;

  return (
    <div className="space-y-6">
      <FormSection title="Ustawienia przypomnień" description="Powiadomienia w panelu tworzy zadanie nocne. E-mail wysyłany jest gdy włączysz opcję poniżej (w dev — log serwera).">
        {settings && (
          <form onSubmit={onSaveSettings} className="space-y-4 max-w-lg">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.expiringPassEmailEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, expiringPassEmailEnabled: e.target.checked })
                }
              />
              Wysyłaj e-mail o wygasających karnetach
            </label>
            <div>
              <label className={labelClassName}>Przypomnij (dni przed końcem)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.expiringPassDaysBefore}
                onChange={(e) =>
                  setSettings({ ...settings, expiringPassDaysBefore: Number(e.target.value) })
                }
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>E-mail powiadomień (opcjonalnie)</label>
              <input
                type="email"
                value={settings.notificationEmail ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, notificationEmail: e.target.value || null })
                }
                className={inputClassName}
                placeholder="recepcja@klub.pl"
              />
            </div>
            <button type="submit" className={primaryButtonClassName}>
              Zapisz ustawienia
            </button>
          </form>
        )}
      </FormSection>

      <FormSection title="Ostatnie powiadomienia">
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 ${n.readAt ? "border-slate-200 bg-white" : "border-primary-200 bg-primary-50/40"}`}
            >
              <div className="flex justify-between gap-2">
                <p className="font-medium text-slate-900">{n.title}</p>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleString("pl-PL")}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{n.message}</p>
              {n.emailSentAt && (
                <p className="text-xs text-emerald-700 mt-1">E-mail wysłany</p>
              )}
              {!n.readAt && (
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className="text-sm text-primary-600 font-medium mt-2 hover:text-primary-700"
                >
                  Oznacz jako przeczytane
                </button>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-sm text-slate-500">Brak powiadomień. Zadanie nocne utworzy wpisy dla karnetów wygasających w wybranym oknie.</p>
          )}
        </div>
      </FormSection>
    </div>
  );
}
