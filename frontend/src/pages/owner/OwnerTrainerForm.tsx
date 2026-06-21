import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import { getOwnerTrainers, createOwnerTrainer, updateOwnerTrainer, getOwnerGymDetails } from "../../api";
import {
  OwnerFormLayout,
  ownerFormCardClassName,
  ownerFormInputClassName,
  ownerFormLabelClassName,
} from "../../components/OwnerFormLayout";
import { LoadingState } from "../../components/LoadingState";
import { primaryButtonClassName } from "../../components/formStyles";
import { useToast } from "../../components/Toast";
import { OwnerContext } from "./types";

export function OwnerTrainerForm({ ctx }: { ctx: OwnerContext }) {
  const { auth } = ctx;
  const { trainerId } = useParams();
  const gymId = ctx.selectedGymId;
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const isEdit = trainerId !== undefined && trainerId !== "new";

  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth || !gymId) return;

    getOwnerGymDetails(auth, Number(gymId))
      .then((res) => setEmployees(res.employees || []))
      .catch((err) => showError(err.message));

    if (isEdit) {
      setLoading(true);
      getOwnerTrainers(auth, Number(gymId))
        .then((trainers) => {
          const t = trainers.find((tr) => tr.id === Number(trainerId));
          if (t) {
            setEmployeeId(String(t.employeeId));
            setBio(t.bio || "");
            setSpecialization(t.specialization || "");
            setHourlyRate(String(t.hourlyRate));
          } else {
            showError("Nie znaleziono trenera");
            navigate("/owner/trainers");
          }
        })
        .catch((err) => showError(err.message))
        .finally(() => setLoading(false));
    }
  }, [auth, gymId, trainerId, isEdit, navigate, showError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth || !gymId) return;

    if (!isEdit && !employeeId) {
      showError("Wybierz pracownika");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateOwnerTrainer(auth, Number(gymId), Number(trainerId), {
          bio,
          specialization,
          hourlyRate: Number(hourlyRate),
        });
        showSuccess("Trener zaktualizowany pomyślnie");
      } else {
        await createOwnerTrainer(auth, Number(gymId), {
          employeeId: Number(employeeId),
          bio,
          specialization,
          hourlyRate: Number(hourlyRate),
        });
        showSuccess("Trener dodany pomyślnie");
      }
      navigate("/owner/trainers");
    } catch (err: any) {
      showError(err.message || "Wystąpił błąd");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Wczytywanie trenera..." />;

  return (
    <OwnerFormLayout
      backTo="/owner/trainers"
      title={isEdit ? "Edycja trenera" : "Nowy trener"}
      subtitle="Profil trenera personalnego w siłowni"
    >
      <form onSubmit={handleSubmit} className={ownerFormCardClassName}>
        {!isEdit && (
          <div>
            <label className={ownerFormLabelClassName}>Pracownik</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Możesz dodać tylko pracownika przypisanego do tej siłowni.
            </p>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className={ownerFormInputClassName}
            >
              <option value="">Wybierz pracownika</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName || emp.lastName
                    ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim()
                    : emp.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={ownerFormLabelClassName}>Stawka godzinowa (PLN)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            required
            className={ownerFormInputClassName}
          />
        </div>

        <div>
          <label className={ownerFormLabelClassName}>Specjalizacja</label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="np. Kulturystyka, Trening Funkcjonalny"
            className={ownerFormInputClassName}
          />
        </div>

        <div>
          <label className={ownerFormLabelClassName}>Biografia / Opis</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Krótki opis doświadczenia i podejścia do treningu..."
            className={`${ownerFormInputClassName} resize-y`}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className={primaryButtonClassName}>
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : "Zapisz trenera"}
          </button>
        </div>
      </form>
    </OwnerFormLayout>
  );
}
