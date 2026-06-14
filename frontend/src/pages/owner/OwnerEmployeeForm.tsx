import { FormEvent, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { createOwnerEmployee, deleteOwnerEmployee, updateOwnerEmployee, getOwnerRanks, type RankView } from "../../api";
import { DetailPageLayout } from "../../components/DetailPageLayout";
import { FormSection } from "../../components/FormSection";
import { AvatarUpload } from "../../components/AvatarUpload";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import {
  dangerButtonClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "../../components/formStyles";
import {
  DEFAULT_EMPLOYEE_PERMISSIONS,
  OPTIONAL_EMPLOYEE_PERMISSIONS,
  PERMISSION_LABELS,
  optionalPermissionsFromList,
  resolveEmployeePermissions,
  type EmployeePermission,
} from "../../permissions";
import type { OwnerContext } from "./types";

export function OwnerEmployeeForm({ ctx, mode }: { ctx: OwnerContext; mode: "create" | "edit" }) {
  const { auth, selectedGymId, details, loadGymsAndDetails, setError, setInfo } = ctx;
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const employee =
    mode === "edit" ? details?.employees?.find((e: any) => e.id === Number(employeeId)) : null;

  const [email, setEmail] = useState(employee?.email ?? "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(employee?.firstName ?? "");
  const [lastName, setLastName] = useState(employee?.lastName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(employee?.avatarUrl);
  const [optionalPermissions, setOptionalPermissions] = useState<EmployeePermission[]>(() =>
    optionalPermissionsFromList(employee?.permissions)
  );
  const [selectedRankId, setSelectedRankId] = useState<number | undefined>(employee?.rankId);
  const [ranks, setRanks] = useState<RankView[]>([]);

  const resolvedPermissions = useMemo(
    () => resolveEmployeePermissions(optionalPermissions),
    [optionalPermissions]
  );

  useEffect(() => {
    if (selectedGymId) {
      getOwnerRanks(auth, Number(selectedGymId))
        .then(setRanks)
        .catch(console.error);
    }
  }, [auth, selectedGymId]);

  if (!details) return <SelectGymPrompt />;

  if (mode === "edit" && employeeId && !employee) {
    return (
      <DetailPageLayout backTo="/owner/employees" title="Pracownik nie znaleziony">
        <p className="text-slate-500">Nie znaleziono pracownika o podanym ID.</p>
      </DetailPageLayout>
    );
  }

  function toggleOptionalPermission(permission: EmployeePermission) {
    setOptionalPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedGymId) return;
    try {
      if (mode === "create") {
        await createOwnerEmployee(auth, Number(selectedGymId), {
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          permissions: selectedRankId ? undefined : resolvedPermissions,
          rankId: selectedRankId || undefined,
          avatarUrl,
        });
        setInfo(`Dodano pracownika ${email} do siłowni`);
      } else if (employee) {
        await updateOwnerEmployee(auth, Number(selectedGymId), employee.id, {
          email,
          password: password || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          permissions: selectedRankId ? undefined : resolvedPermissions,
          rankId: selectedRankId || undefined,
          avatarUrl,
        });
        setInfo(`Zaktualizowano dane pracownika ${email}`);
      }
      await loadGymsAndDetails();
      navigate("/owner/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać danych pracownika");
    }
  }

  async function onDelete() {
    if (!selectedGymId || !employee) return;
    try {
      await deleteOwnerEmployee(auth, Number(selectedGymId), employee.id);
      setInfo(`Usunięto pracownika ${employee.email} z siłowni`);
      await loadGymsAndDetails();
      navigate("/owner/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć pracownika");
    }
  }

  return (
    <DetailPageLayout
      backTo="/owner/employees"
      breadcrumb="Pracownicy"
      title={mode === "create" ? "Nowy pracownik" : employee!.email}
      subtitle={mode === "edit" ? "Edytuj dane i uprawnienia pracownika" : "Dodaj pracownika do siłowni"}
      headerExtra={
        mode === "edit" ? (
          <button type="button" onClick={onDelete} className={dangerButtonClassName}>
            <Trash2 className="w-4 h-4" />
            Usuń
          </button>
        ) : undefined
      }
    >
      <FormSection title="Dane pracownika">
        <form onSubmit={onSubmit} className="space-y-6 max-w-lg">
          <AvatarUpload
            currentUrl={avatarUrl}
            onUploadSuccess={setAvatarUrl}
            className="mb-6"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClassName}>Imię</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClassName} placeholder="Jan" />
            </div>
            <div>
              <label className={labelClassName}>Nazwisko</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClassName} placeholder="Kowalski" />
            </div>
          </div>
          <div>
            <label className={labelClassName}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClassName} required />
          </div>
          <div>
            <label className={labelClassName}>
              {mode === "create" ? "Hasło startowe" : "Nowe hasło (opcjonalnie)"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
              required={mode === "create"}
            />
          </div>

          <div>
            <label className={labelClassName}>Ranga</label>
            <p className="text-xs text-slate-500 mb-2">Wybierz rangę dla pracownika lub przypisz uprawnienia ręcznie niżej.</p>
            <select
              value={selectedRankId || ""}
              onChange={(e) => setSelectedRankId(e.target.value ? Number(e.target.value) : undefined)}
              className={inputClassName}
            >
              <option value="">Brak rangi (własne uprawnienia)</option>
              {ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {!selectedRankId && (
            <>
              <div className="space-y-3">
            <div>
              <p className={labelClassName}>Uprawnienia podstawowe</p>
              <p className="text-xs text-slate-500 mt-1">
                Każdy pracownik otrzymuje ten zestaw automatycznie.
              </p>
            </div>
            <ul className="space-y-2">
              {DEFAULT_EMPLOYEE_PERMISSIONS.map((permission) => (
                <li
                  key={permission}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <input type="checkbox" checked disabled className="rounded border-slate-300" />
                  {PERMISSION_LABELS[permission]}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div>
              <p className={labelClassName}>Dodatkowe uprawnienia</p>
              <p className="text-xs text-slate-500 mt-1">
                Właściciel może nadać pracownikowi rozszerzone uprawnienia.
              </p>
            </div>
            <ul className="space-y-2">
              {OPTIONAL_EMPLOYEE_PERMISSIONS.map((permission) => (
                <li key={permission}>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={optionalPermissions.includes(permission)}
                      onChange={() => toggleOptionalPermission(permission)}
                      className="rounded border-slate-300 dark:border-slate-700 text-primary-500 focus:ring-primary-500 dark:bg-slate-950"
                    />
                    {PERMISSION_LABELS[permission]}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          </>
          )}

          <button type="submit" className={primaryButtonClassName}>
            {mode === "create" ? "Dodaj pracownika" : "Zapisz zmiany"}
          </button>
        </form>
      </FormSection>
    </DetailPageLayout>
  );
}
