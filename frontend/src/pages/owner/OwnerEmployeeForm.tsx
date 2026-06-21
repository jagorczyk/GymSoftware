import { FormEvent, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import { createOwnerEmployee, deleteOwnerEmployee, updateOwnerEmployee, getOwnerRanks, type RankView } from "../../api";
import { AvatarUpload } from "../../components/AvatarUpload";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import {
  OwnerFormLayout,
  ownerFormCardClassName,
  ownerFormInputClassName,
  ownerFormLabelClassName,
} from "../../components/OwnerFormLayout";
import { PermissionCheckboxGrid } from "../../components/PermissionCheckboxGrid";
import {
  dangerButtonClassName,
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
  const [saving, setSaving] = useState(false);

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
      <OwnerFormLayout backTo="/owner/employees" title="Pracownik nie znaleziony">
        <div className={ownerFormCardClassName}>
          <p className="text-slate-500 dark:text-slate-400">Nie znaleziono pracownika o podanym ID.</p>
        </div>
      </OwnerFormLayout>
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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedGymId || !employee) return;
    if (!window.confirm("Czy na pewno chcesz usunąć tego pracownika?")) return;
    setSaving(true);
    try {
      await deleteOwnerEmployee(auth, Number(selectedGymId), employee.id);
      setInfo(`Usunięto pracownika ${employee.email} z siłowni`);
      await loadGymsAndDetails();
      navigate("/owner/employees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć pracownika");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OwnerFormLayout
      backTo="/owner/employees"
      title={mode === "create" ? "Nowy pracownik" : "Edycja pracownika"}
      subtitle={mode === "edit" ? employee!.email : "Dodaj pracownika do siłowni"}
      headerExtra={
        mode === "edit" ? (
          <button type="button" onClick={onDelete} disabled={saving} className={dangerButtonClassName}>
            <Trash2 className="w-4 h-4" />
            Usuń
          </button>
        ) : undefined
      }
    >
      <form onSubmit={onSubmit} className={ownerFormCardClassName}>
        <AvatarUpload currentUrl={avatarUrl} onUploadSuccess={setAvatarUrl} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={ownerFormLabelClassName}>Imię</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={ownerFormInputClassName}
              placeholder="Jan"
            />
          </div>
          <div>
            <label className={ownerFormLabelClassName}>Nazwisko</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={ownerFormInputClassName}
              placeholder="Kowalski"
            />
          </div>
        </div>

        <div>
          <label className={ownerFormLabelClassName}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={ownerFormInputClassName}
            required
          />
        </div>

        <div>
          <label className={ownerFormLabelClassName}>
            {mode === "create" ? "Hasło startowe" : "Nowe hasło (opcjonalnie)"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={ownerFormInputClassName}
            required={mode === "create"}
          />
        </div>

        <div>
          <label className={ownerFormLabelClassName}>Ranga</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Wybierz rangę lub przypisz uprawnienia ręcznie poniżej.
          </p>
          <select
            value={selectedRankId || ""}
            onChange={(e) => setSelectedRankId(e.target.value ? Number(e.target.value) : undefined)}
            className={ownerFormInputClassName}
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
            <div>
              <label className={`${ownerFormLabelClassName} mb-1`}>Uprawnienia podstawowe</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Każdy pracownik otrzymuje ten zestaw automatycznie.
              </p>
              <PermissionCheckboxGrid
                items={DEFAULT_EMPLOYEE_PERMISSIONS.map((permission) => ({
                  key: permission,
                  label: PERMISSION_LABELS[permission],
                  selected: true,
                  disabled: true,
                }))}
              />
            </div>

            <div>
              <label className={`${ownerFormLabelClassName} mb-1`}>Dodatkowe uprawnienia</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Właściciel może nadać pracownikowi rozszerzone uprawnienia.
              </p>
              <PermissionCheckboxGrid
                items={OPTIONAL_EMPLOYEE_PERMISSIONS.map((permission) => ({
                  key: permission,
                  label: PERMISSION_LABELS[permission],
                  selected: optionalPermissions.includes(permission),
                  onToggle: () => toggleOptionalPermission(permission),
                }))}
              />
            </div>
          </>
        )}

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className={primaryButtonClassName}>
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : mode === "create" ? "Dodaj pracownika" : "Zapisz zmiany"}
          </button>
        </div>
      </form>
    </OwnerFormLayout>
  );
}
