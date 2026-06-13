import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Ticket, KeyRound, UserPen, ShoppingCart } from "lucide-react";
import {
  assignLocker,
  checkInGuest,
  checkOutGuest,
  getEmployeeGuestDetail,
  leaveGym,
  sellPass,
  updateEmployeeGuest,
  returnLocker,
  type GuestDetail,
} from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { EntityList } from "../../components/EntityList";
import { EntityListCard } from "../../components/EntityListCard";
import { FormSection } from "../../components/FormSection";
import { ListToolbar } from "../../components/ListToolbar";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { GuestPassActions } from "../../components/GuestPassActions";
import { AvatarUpload } from "../../components/AvatarUpload";
import {
  dangerButtonClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeeGuestDetail({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, overview, setMessage, setError, refreshOverview } = ctx;
  const { guestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GuestDetail | null>(null);
  const [lockerQuery, setLockerQuery] = useState("");
  const [selectedLockerId, setSelectedLockerId] = useState<number | "">("");
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const guest = detail?.guest;

  const filteredLockers = useMemo(() => {
    const lockers = overview?.allLockers ?? [];
    const q = lockerQuery.trim().toLowerCase();
    if (!q) return lockers;
    return lockers.filter((l: any) => l.lockerNumber.toLowerCase().includes(q));
  }, [overview?.allLockers, lockerQuery]);

  const isLockerOccupied = (locker: { status: string; guestId?: number | null }) =>
    locker.status === "OCCUPIED" || locker.guestId != null;

  async function load() {
    if (!selectedGymId || !guestId) return;
    setLoading(true);
    try {
      const data = await getEmployeeGuestDetail(auth, Number(selectedGymId), Number(guestId));
      setDetail(data);
      setFirstName(data.guest.firstName);
      setLastName(data.guest.lastName);
      setEmail(data.guest.email ?? "");
      setPhone(data.guest.phone ?? "");
      setNotes(data.guest.notes ?? "");
      setAvatarUrl(data.guest.avatarUrl ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać danych klienta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedGymId) return;
    refreshOverview();
    setSelectedLockerId("");
    setLockerQuery("");
  }, [selectedGymId, guestId, refreshOverview]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, selectedGymId, guestId]);

  async function onSellPass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGymId || !guest) return;
    const form = new FormData(event.currentTarget);
    const passType = String(form.get("passType"));
    const guestName = `${guest.firstName} ${guest.lastName}`;
    try {
      await sellPass(auth, Number(selectedGymId), {
        guestId: guest.id,
        passType,
        startDate: String(form.get("startDate")),
        endDate: String(form.get("endDate")),
        price: Number(form.get("price")),
      });
      setError("");
      setMessage(`Sprzedano karnet „${passType}” klientowi ${guestName}`);
      await load();
      refreshOverview();
    } catch (err) {
      setMessage("");
      setError(err instanceof Error ? err.message : "Nie udało się sprzedać karnetu");
    }
  }

  async function onAssignLocker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedGymId || !guest || !selectedLockerId) return;
    const lockerId = Number(selectedLockerId);
    const locker = overview?.allLockers?.find((l: any) => l.id === lockerId);
    const lockerNumber = locker?.lockerNumber ?? String(lockerId);
    try {
      await assignLocker(auth, Number(selectedGymId), { lockerId, guestId: guest.id });
      setError("");
      setMessage(`Nadano szafkę nr ${lockerNumber} klientowi ${guest.firstName} ${guest.lastName}`);
      setSelectedLockerId("");
      await load();
      refreshOverview();
    } catch (err) {
      setMessage("");
      setError(err instanceof Error ? err.message : "Nie udało się nadać szafki klientowi");
    }
  }

  async function onCheckIn() {
    if (!selectedGymId || !guest) return;
    try {
      await checkInGuest(auth, Number(selectedGymId), guest.id);
      setMessage(`Zarejestrowano wejście: ${guest.firstName} ${guest.lastName}`);
      await load();
      refreshOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zarejestrować wejścia");
    }
  }

  async function onCheckOut() {
    if (!selectedGymId || !guest) return;
    try {
      await checkOutGuest(auth, Number(selectedGymId), guest.id);
      setMessage(`Zarejestrowano wyjście: ${guest.firstName} ${guest.lastName}`);
      await load();
      refreshOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zarejestrować wyjścia");
    }
  }

  async function onReturnLocker() {
    if (!selectedGymId || !guest) return;
    try {
      await returnLocker(auth, Number(selectedGymId), guest.id);
      setMessage(`Odebrano kluczyk klientowi: ${guest.firstName} ${guest.lastName}`);
      await load();
      refreshOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się odebrać szafki");
    }
  }

  async function onQuickAssignLocker() {
    if (!selectedGymId || !guest) return;
    const lockers = overview?.allLockers ?? [];
    const firstFree = lockers.find((l: any) => l.status !== "OCCUPIED" && l.guestId == null);
    
    if (!firstFree) {
      setError("Brak wolnych szafek!");
      return;
    }
    
    try {
      await assignLocker(auth, Number(selectedGymId), { lockerId: firstFree.id, guestId: guest.id });
      setError("");
      setMessage(`Nadano szafkę nr ${firstFree.lockerNumber} klientowi ${guest.firstName} ${guest.lastName}`);
      await load();
      refreshOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się szybko nadać szafki");
    }
  }

  async function onLeaveGym() {
    if (!selectedGymId || !guest) return;
    try {
      await leaveGym(auth, Number(selectedGymId), guest.id);
      setMessage(`Zakończono wizytę klienta ${guest.firstName} ${guest.lastName}`);
      await load();
      refreshOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zakończyć wizyty");
    }
  }

  async function onSaveGuest(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId || !guestId) return;
    try {
      await updateEmployeeGuest(auth, Number(selectedGymId), Number(guestId), {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        avatarUrl,
      });
      setMessage("Zaktualizowano dane klienta");
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać danych");
    }
  }

  if (!selectedGymId) return <SelectGymDashboardPrompt />;
  if (loading) return <LoadingState message="Ładowanie klienta..." />;

  if (!guest) {
    return (
      <DetailPageLayout backTo="/employee/guests" title="Klient nie znaleziony">
        <p className="text-slate-500 dark:text-slate-400">Nie znaleziono klienta o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  const canEndVisit = guest.isPresent || guest.hasLocker;

  return (
    <DetailPageLayout
      backTo="/employee/guests"
      breadcrumb="Klienci"
      title={`${guest.firstName} ${guest.lastName}`}
      subtitle={`ID: ${guest.id} • ${guest.email || guest.phone || "Brak kontaktu"}`}
      headerExtra={
        <div className="flex flex-wrap gap-2">
          {!guest.isPresent ? (
            <button type="button" onClick={onCheckIn} className={primaryButtonClassName} disabled={!guest.hasActivePass}>
              <LogIn className="w-4 h-4" />
              Wejście na salę
            </button>
          ) : (
            <button type="button" onClick={onCheckOut} className={dangerButtonClassName}>
              <LogOut className="w-4 h-4" />
              Wyjście
            </button>
          )}
          
          {guest.isPresent && !guest.hasLocker && (
            <button type="button" onClick={onQuickAssignLocker} className={`${primaryButtonClassName} !bg-indigo-600 hover:!bg-indigo-700`}>
              <KeyRound className="w-4 h-4" />
              Szybka Szafka
            </button>
          )}
          
          {guest.hasLocker && (
            <button type="button" onClick={onReturnLocker} className={`${secondaryButtonClassName} !text-indigo-600 !border-indigo-200 hover:!bg-indigo-50`}>
              <KeyRound className="w-4 h-4" />
              Odbierz kluczyk
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/employee/pos?guestId=${guest.id}`)}
            className={`${secondaryButtonClassName} !text-primary-550 !border-primary-100 dark:!border-primary-900/50 hover:!bg-primary-50 dark:hover:!bg-primary-950/20`}
          >
            <ShoppingCart className="w-4 h-4" />
            Sprzedaj produkt
          </button>

          {canEndVisit && (
            <button type="button" onClick={onLeaveGym} className={dangerButtonClassName}>
              Zakończ wizytę (wyjście + szafka)
            </button>
          )}
        </div>
      }
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {guest.avatarUrl ? (
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-850">
              <img src={guest.avatarUrl.startsWith("http") ? guest.avatarUrl : `http://localhost:8080${guest.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center text-xl font-bold shrink-0">
              {(guest.firstName?.[0] || "K").toUpperCase()}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <StatusChip status={guest.hasActivePass ? "ACTIVE" : "INACTIVE"} label={guest.hasActivePass ? "Aktywny karnet" : "Brak karnetu"} />
            {guest.hasActivePass && guest.activePassEndDate && (
              <span className="text-xs font-medium px-2 py-1 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 rounded-lg border border-primary-100 dark:border-primary-900/40 flex items-center gap-1">
                <Ticket className="w-3 h-3" />
                Do: {guest.activePassEndDate}
              </span>
            )}
            <StatusChip status={guest.isPresent ? "ACTIVE" : "INACTIVE"} label={guest.isPresent ? "Na sali" : "Poza salą"} />
            {guest.hasLocker && <StatusChip status="OCCUPIED" label="Szafka" />}
          </div>
        </div>
        {!guest.hasActivePass && (
          <p className="text-sm text-amber-800 dark:text-amber-400 mt-3">Wejście na salę wymaga aktywnego karnetu — najpierw sprzedaj karnet.</p>
        )}
      </div>

      <FormSection
        title="Dane klienta"
        description="Telefon i notatki widoczne dla całego personelu klubu."
      >
        <button type="button" onClick={() => setEditing((v) => !v)} className={`${primaryButtonClassName} mb-4`}>
          <UserPen className="w-4 h-4" />
          {editing ? "Anuluj" : "Edytuj dane"}
        </button>
        {editing ? (
          <form onSubmit={onSaveGuest} className="space-y-4 max-w-lg">
            <AvatarUpload
              currentUrl={avatarUrl}
              onUploadSuccess={setAvatarUrl}
              className="mb-4"
            />
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClassName} placeholder="Imię" required />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClassName} placeholder="Nazwisko" required />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} placeholder="Email" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClassName} placeholder="Telefon" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClassName} placeholder="Notatki" rows={2} />
            <button type="submit" className={primaryButtonClassName}>Zapisz</button>
          </form>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {guest.phone && <>Tel: {guest.phone} • </>}
            {guest.notes || "Brak notatek"}
          </p>
        )}
      </FormSection>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FormSection title="Sprzedaż karnetu">
          <form onSubmit={onSellPass} className="space-y-4">
            <div>
              <label className={labelClassName}>Wybierz ofertę</label>
              <select
                name="passTypeId"
                className={inputClassName}
                onChange={(e) => {
                  const ptId = Number(e.target.value);
                  const pt = overview?.passTypes?.find((x: any) => x.id === ptId);
                  if (pt) {
                    const form = e.target.form!;
                    (form.elements.namedItem("passType") as HTMLInputElement).value = pt.name;
                    (form.elements.namedItem("price") as HTMLInputElement).value = pt.price.toString();
                    const startInput = form.elements.namedItem("startDate") as HTMLInputElement;
                    const startDate = startInput.value ? new Date(startInput.value) : new Date();
                    if (!startInput.value) startInput.value = startDate.toISOString().split("T")[0];
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + pt.durationDays);
                    (form.elements.namedItem("endDate") as HTMLInputElement).value = endDate.toISOString().split("T")[0];
                  }
                }}
              >
                <option value="">-- Wybierz typ karnetu --</option>
                {overview?.passTypes?.map((pt: any) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} ({pt.price} zł / {pt.durationDays} dni)
                  </option>
                ))}
              </select>
            </div>
            <input type="text" name="passType" required className={`${inputClassName} bg-gray-50 dark:bg-slate-950/40`} placeholder="Nazwa karnetu" />
            <input type="date" name="startDate" required defaultValue={new Date().toISOString().split("T")[0]} className={inputClassName} />
            <input type="date" name="endDate" required className={inputClassName} />
            <input type="number" name="price" required step="0.01" className={inputClassName} placeholder="Cena" />
            <button type="submit" className={`${primaryButtonClassName} w-full`}>Sprzedaj karnet</button>
          </form>
        </FormSection>

        <FormSection title="Nadanie szafki">
          {guest.hasLocker ? (
            <p className="text-sm text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3">
              Klient ma już szafkę. Odbierz szafkę przy wyjściu.
            </p>
          ) : (
            <form onSubmit={onAssignLocker} className="space-y-4">
              <ListToolbar searchValue={lockerQuery} onSearchChange={setLockerQuery} searchPlaceholder="Szukaj szafki..." />
              <EntityList emptyMessage="Brak wolnych szafek w tej siłowni">
                {filteredLockers.map((l: any) => {
                  const occupied = isLockerOccupied(l);
                  return (
                    <EntityListCard
                      key={l.id}
                      title={`Szafka ${l.lockerNumber}`}
                      metadata={<StatusChip status={occupied ? "OCCUPIED" : "FREE"} />}
                      selected={selectedLockerId === l.id}
                      disabled={occupied}
                      showChevron={false}
                      onClick={() => setSelectedLockerId(l.id)}
                    />
                  );
                })}
              </EntityList>
              <button type="submit" disabled={!selectedLockerId} className={`${primaryButtonClassName} w-full disabled:opacity-50`}>
                <KeyRound className="w-4 h-4" />
                Nadaj szafkę
              </button>
            </form>
          )}
        </FormSection>
      </div>

      {detail && detail.passes.length > 0 && (
        <FormSection title="Karnety klienta" description="Przedłużenie lub anulowanie.">
          <div className="space-y-3 mt-4">
            {detail.passes.map((pass) => (
              <GuestPassActions
                key={pass.id}
                auth={auth}
                gymId={Number(selectedGymId)}
                pass={pass}
                onUpdated={load}
                setError={setError}
                setInfo={setMessage}
              />
            ))}
          </div>
        </FormSection>
      )}
    </DetailPageLayout>
  );
}
