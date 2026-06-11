import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployeeGuest } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { AvatarUpload } from "../../components/AvatarUpload";
import { inputClassName, labelClassName, primaryButtonClassName } from "../../components/formStyles";
import { SelectGymDashboardPrompt } from "./EmployeeHome";
import type { EmployeeContext } from "./types";

export function EmployeeGuestForm({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, setMessage, setError } = ctx;
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const created = await createEmployeeGuest(auth, Number(selectedGymId), {
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        avatarUrl,
      });
      setMessage(`Zarejestrowano klienta ${created.firstName} ${created.lastName} w systemie`);
      setError("");
      navigate(`/employee/guests/${created.id}`);
    } catch (err) {
      setMessage("");
      setError(err instanceof Error ? err.message : "Nie udało się zarejestrować klienta");
    }
  }

  return (
    <DetailPageLayout
      backTo="/employee/guests"
      breadcrumb="Klienci"
      title="Nowy klient"
      subtitle="Zarejestruj nowego klienta w systemie"
    >
      <FormSection title="Dane klienta">
        <form onSubmit={onSubmit} className="space-y-6 max-w-lg">
          <AvatarUpload
            currentUrl={avatarUrl}
            onUploadSuccess={setAvatarUrl}
            className="mb-6"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Imię</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClassName} required />
            </div>
            <div>
              <label className={labelClassName}>Nazwisko</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClassName} required />
            </div>
          </div>
          <div>
            <label className={labelClassName}>Email (opcjonalnie)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Telefon (opcjonalnie)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClassName} />
          </div>
          <div>
            <label className={labelClassName}>Notatki (opcjonalnie)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClassName} rows={2} />
          </div>
          <button type="submit" className={primaryButtonClassName}>
            Zarejestruj klienta
          </button>
        </form>
      </FormSection>
    </DetailPageLayout>
  );
}
