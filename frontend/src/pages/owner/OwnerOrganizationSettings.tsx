import { FormEvent, useEffect, useState } from "react";
import { Save, Upload } from "lucide-react";
import {
  getOwnerOrganizationSettings,
  getOwnerGyms,
  importOwnerEmployees,
  updateOwnerOrganizationSettings,
  type PassDeductTiming,
} from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { FormSection } from "../../components/FormSection";
import { PermissionCheckboxGrid } from "../../components/PermissionCheckboxGrid";
import { LoadingState } from "../../components/LoadingState";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../../components/formStyles";
import {
  OPTIONAL_EMPLOYEE_PERMISSIONS,
  PERMISSION_LABELS,
  type EmployeePermission,
} from "../../permissions";
import type { OwnerContext } from "./types";

const IMPORT_TEMPLATE = `email,password,firstName,lastName,gymName,permissions
jan.kowalski@example.com,Haslo123!,Jan,Kowalski,Moja Siłownia,MANAGE_SCHEDULE|MANAGE_PASS_TYPES`;

export function OwnerOrganizationSettings({ ctx }: { ctx: OwnerContext }) {
  const { auth, setError, setInfo } = ctx;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [passDeductTiming, setPassDeductTiming] = useState<PassDeductTiming>("CHECK_IN");
  const [optionalPermissions, setOptionalPermissions] = useState<EmployeePermission[]>([]);
  const [csv, setCsv] = useState(IMPORT_TEMPLATE);
  const [gymNames, setGymNames] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [settings, gyms] = await Promise.all([
          getOwnerOrganizationSettings(auth),
          getOwnerGyms(auth),
        ]);
        setPassDeductTiming(settings.passDeductTiming);
        setOptionalPermissions(
          settings.defaultEmployeePermissions.filter((p): p is EmployeePermission =>
            OPTIONAL_EMPLOYEE_PERMISSIONS.includes(p as EmployeePermission)
          )
        );
        setGymNames(gyms.map((g) => g.name));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się pobrać ustawień");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth, setError]);

  function togglePermission(permission: EmployeePermission) {
    setOptionalPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  }

  async function onSaveSettings(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateOwnerOrganizationSettings(auth, {
        passDeductTiming,
        defaultEmployeePermissions: optionalPermissions,
      });
      setInfo("Zapisano ustawienia organizacji");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać ustawień");
    } finally {
      setSaving(false);
    }
  }

  async function onImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importOwnerEmployees(auth, { csv });
      setImportResult(result);
      setInfo(`Import zakończony: dodano ${result.created}, pominięto ${result.skipped}`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import nie powiódł się");
    } finally {
      setImporting(false);
    }
  }

  if (loading) return <LoadingState message="Ładowanie ustawień..." />;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <PageHeader
        title="Ustawienia organizacji"
        subtitle="Wspólne reguły dla wszystkich Twoich siłowni — karnety, pracownicy i uprawnienia."
      />

      <form onSubmit={onSaveSettings} className="space-y-6">
        <FormSection
          title="Karnety na wejścia"
          description="Określ, kiedy system odejmuje wejście z karnetu jednorazowego lub wieloweściowego."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPassDeductTiming("CHECK_IN")}
              className={`rounded-2xl border-2 p-4 text-left ${
                passDeductTiming === "CHECK_IN" ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <p className="font-bold">Przy wejściu</p>
              <p className="text-sm text-slate-500 mt-1">Wejście zostaje odjęte w momencie check-inu na sali.</p>
            </button>
            <button
              type="button"
              onClick={() => setPassDeductTiming("CHECK_OUT")}
              className={`rounded-2xl border-2 p-4 text-left ${
                passDeductTiming === "CHECK_OUT" ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20" : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <p className="font-bold">Przy wyjściu</p>
              <p className="text-sm text-slate-500 mt-1">Wejście zostaje odjęte przy check-outcie lub zakończeniu wizyty.</p>
            </button>
          </div>
        </FormSection>

        <FormSection
          title="Domyślne uprawnienia pracowników"
          description="Stosowane przy tworzeniu pracownika bez wybranych uprawnień oraz jako baza przy imporcie CSV."
        >
          <PermissionCheckboxGrid
            items={OPTIONAL_EMPLOYEE_PERMISSIONS.map((permission) => ({
              key: permission,
              label: PERMISSION_LABELS[permission],
              selected: optionalPermissions.includes(permission),
              onToggle: () => togglePermission(permission),
            }))}
          />
        </FormSection>

        <button type="submit" disabled={saving} className={primaryButtonClassName}>
          <Save className="w-4 h-4" />
          {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
        </button>
      </form>

      <FormSection
        title="Import pracowników (CSV)"
        description="Jedna osoba = jedno konto (e-mail musi być unikalny w systemie). Kolumna gymName musi dokładnie odpowiadać nazwie siłowni."
        className="mt-8"
      >
        {gymNames.length > 0 && (
          <p className="text-sm text-slate-500 mb-3">
            Twoje siłownie: {gymNames.join(", ")}
          </p>
        )}
        <label className={labelClassName}>Plik CSV</label>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={8}
          className={`${inputClassName} font-mono text-xs`}
        />
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={onImport} disabled={importing} className={primaryButtonClassName}>
            <Upload className="w-4 h-4" />
            {importing ? "Importowanie..." : "Importuj pracowników"}
          </button>
          <button type="button" onClick={() => setCsv(IMPORT_TEMPLATE)} className={secondaryButtonClassName}>
            Przykładowy szablon
          </button>
        </div>
        {importResult && (
          <div className="mt-4 text-sm space-y-2">
            <p className="text-slate-700 dark:text-slate-300">
              Dodano: <strong>{importResult.created}</strong>, pominięto: <strong>{importResult.skipped}</strong>
            </p>
            {importResult.errors.length > 0 && (
              <ul className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 space-y-1">
                {importResult.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </FormSection>
    </div>
  );
}
