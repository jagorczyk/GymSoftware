import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOwnerGuestDetail, updateOwnerGuest, type GuestDetail } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { AvatarUpload } from "../../components/AvatarUpload";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { LoadingState } from "../../components/LoadingState";
import { StatusChip } from "../../components/StatusChip";
import { GuestPassActions } from "../../components/GuestPassActions";
import { inputClassName, labelClassName, primaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

export function OwnerGuestDetail({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, loadGymsAndDetails, setError, setInfo } = ctx;
  const { guestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GuestDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  async function load() {
    if (!selectedGymId || !guestId) return;
    setLoading(true);
    try {
      const data = await getOwnerGuestDetail(auth, Number(selectedGymId), Number(guestId));
      setDetail(data);
      setFirstName(data.guest.firstName);
      setLastName(data.guest.lastName);
      setEmail(data.guest.email ?? "");
      setPhone(data.guest.phone ?? "");
      setNotes(data.guest.notes ?? "");
      setAvatarUrl(data.guest.avatarUrl ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udaĹ‚o siÄ™ pobraÄ‡ klienta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGymId, guestId]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId || !guestId) return;
    try {
      await updateOwnerGuest(auth, Number(selectedGymId), Number(guestId), {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        avatarUrl,
      });
      setInfo("Zaktualizowano dane klienta");
      setEditing(false);
      await load();
      await loadGymsAndDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udaĹ‚o siÄ™ zapisaÄ‡ zmian");
    }
  }

  if (!selectedGymId) return <SelectGymPrompt />;
  if (loading) return <LoadingState message="Ĺadowanie klienta..." />;
  if (!detail) {
    return (
      <DetailPageLayout backTo="/owner/guests" title="Klient nie znaleziony">
        <p className="text-slate-500">Nie znaleziono klienta o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  const { guest } = detail;

  return (
    <DetailPageLayout
      backTo="/owner/guests"
      breadcrumb="Klienci"
      title={`${guest.firstName} ${guest.lastName}`}
      subtitle={guest.email || guest.phone || `ID: ${guest.id}`}
      headerExtra={
        <button type="button" onClick={() => setEditing((v) => !v)} className={primaryButtonClassName}>
          {editing ? "Anuluj edycjÄ™" : "Edytuj dane"}
        </button>
      }
    >
      <div className="flex flex-wrap gap-2 mb-6">
        <StatusChip status={guest.hasActivePass ? "ACTIVE" : "INACTIVE"} label={guest.hasActivePass ? "Aktywny karnet" : "Brak karnetu"} />
        <StatusChip status={guest.isPresent ? "ACTIVE" : "INACTIVE"} label={guest.isPresent ? "Na sali" : "Poza salÄ…"} />
        {guest.hasLocker && <StatusChip status="OCCUPIED" label="Ma szafkÄ™" />}
      </div>

      <FormSection title="Dane klienta">
        {editing ? (
          <form onSubmit={onSave} className="space-y-4 max-w-lg">
            <AvatarUpload
              currentUrl={avatarUrl}
              onUploadSuccess={setAvatarUrl}
              className="mb-6"
            />
            <div>
              <label className={labelClassName}>ImiÄ™</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClassName} required />
            </div>
            <div>
              <label className={labelClassName}>Nazwisko</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClassName} required />
            </div>
            <div>
              <label className={labelClassName}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} />
            </div>
            <div>
              <label className={labelClassName}>Telefon</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClassName} />
            </div>
            <div>
              <label className={labelClassName}>Notatki</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClassName} rows={3} />
            </div>
            <button type="submit" className={primaryButtonClassName}>
              Zapisz
            </button>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {guest.avatarUrl && (
              <div className="shrink-0 w-24 h-24 rounded-full overflow-hidden border border-slate-200">
                <img src={guest.avatarUrl.startsWith("http") ? guest.avatarUrl : `${guest.avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            )}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm flex-1">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900 mt-1">{guest.email || "â€”"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Telefon</dt>
              <dd className="font-medium text-slate-900 mt-1">{guest.phone || "â€”"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Notatki</dt>
              <dd className="font-medium text-slate-900 mt-1 whitespace-pre-wrap">{guest.notes || "â€”"}</dd>
            </div>
            </dl>
          </div>
        )}
      </FormSection>

      <FormSection title="Historia karnetĂłw" description="PrzedĹ‚uĹĽenie lub anulowanie karnetu.">
        <div className="space-y-3">
          {detail.passes.map((pass) => (
            <GuestPassActions
              key={pass.id}
              auth={auth}
              gymId={Number(selectedGymId)}
              pass={pass}
              onUpdated={load}
              setError={setError}
              setInfo={setInfo}
            />
          ))}
          {detail.passes.length === 0 && <p className="text-sm text-slate-500">Brak karnetĂłw dla tego klienta.</p>}
        </div>
      </FormSection>
    </DetailPageLayout>
  );
}
