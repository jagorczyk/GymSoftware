import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";
import { getOwnerTrainers, createOwnerTrainer, updateOwnerTrainer, getOwnerGymDetails } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { ArrowLeft, Save } from "lucide-react";

import { OwnerContext } from "./types";

export function OwnerTrainerForm({ ctx }: { ctx: OwnerContext }) {
  const { auth } = useAuth();
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

    // Load employees for dropdown
    getOwnerGymDetails(auth, Number(gymId))
      .then((res) => {
        setEmployees(res.employees || []);
      })
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
            navigate(`/owner/trainers`);
          }
        })
        .catch((err) => showError(err.message))
        .finally(() => setLoading(false));
    }
  }, [auth, gymId, trainerId, isEdit, navigate, showError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth || !gymId) return;
    
    if (!employeeId) {
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
      navigate(`/owner/trainers`);
    } catch (err: any) {
      showError(err.message || "Wystąpił błąd");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Wczytywanie...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/owner/trainers`)}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PageHeader title={isEdit ? "Edytuj trenera" : "Dodaj trenera"} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        {!isEdit && (
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pracownik</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-900 dark:text-white"
            >
              <option value="">Wybierz pracownika</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.email}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Możesz dodać tylko pracownika, który jest już przypisany do tej siłowni.</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Stawka godzinowa (PLN)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Specjalizacja</label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="np. Kulturystyka, Trening Funkcjonalny"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Biografia / Opis</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Krótki opis doświadczenia i podejścia do treningu..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-900 dark:text-white resize-y"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-slate-900 dark:bg-primary-500 hover:bg-slate-800 dark:hover:bg-primary-400 text-white dark:text-slate-950 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? "Zapisywanie..." : "Zapisz"}
          </button>
        </div>
      </form>
    </div>
  );
}
