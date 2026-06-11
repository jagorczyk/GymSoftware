import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { createClass, updateClass, getClasses } from "../../api"; 

import type { EmployeeContext } from "./types";
import { PageHeader } from "../../components/PageHeader";
import { FormSection } from "../../components/FormSection";

export function EmployeeClassForm({ ctx, isEdit = false }: { ctx: EmployeeContext; isEdit?: boolean }) {
  const { auth, selectedGymId, setError } = ctx;
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(15);
  // For MVP, we will just use the current user's ID as instructor if we don't have a list.
  // Wait, auth token doesn't give us employee ID directly, it gives userId.
  const [instructorId, setInstructorId] = useState<number | "">("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && classId && selectedGymId) {
      // Find the class by ID to edit (fetch a range and filter)
      const from = new Date(); from.setFullYear(from.getFullYear() - 1);
      const to = new Date(); to.setFullYear(to.getFullYear() + 1);
      
      getClasses(auth, Number(selectedGymId), from.toISOString(), to.toISOString())
        .then((res: any) => {
          const c = res.find((x: any) => x.id === Number(classId));
          if (c) {
            setName(c.name);
            setDescription(c.description);
            setStartTime(c.startTime.substring(0, 16)); // format for datetime-local
            setEndTime(c.endTime.substring(0, 16));
            setCapacity(c.capacity);
            setInstructorId(c.instructorId);
          }
        })
        .catch((err: unknown) => setError(err instanceof Error ? err.message : "Błąd ładowania zajęć"));
    }
  }, [isEdit, classId, selectedGymId, auth, setError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGymId) return;

    if (!instructorId) {
        setError("Wpisz ID instruktora (Pracownika). W pełnej wersji będzie tu lista wyboru.");
        return;
    }

    setSaving(true);
    const payload = {
      name,
      description,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      capacity,
      instructorId: Number(instructorId)
    };

    try {
      if (isEdit && classId) {
        await updateClass(auth, Number(selectedGymId), Number(classId), payload);
      } else {
        await createClass(auth, Number(selectedGymId), payload);
      }
      navigate(`/employee/classes`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to={`/employee/classes`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Wróć do grafiku
      </Link>

      <PageHeader
        title={isEdit ? "Edycja zajęć" : "Nowe zajęcia"}
        subtitle="Ustal szczegóły zajęć grupowych."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Podstawowe informacje">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nazwa zajęć *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="np. Joga dla początkujących"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Opis</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                placeholder="Krótki opis zajęć..."
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Termin i limity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Czas rozpoczęcia *</label>
              <input
                required
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Czas zakończenia *</label>
              <input
                required
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Pojemność sali (osoby) *</label>
              <input
                required
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ID Instruktora (MVP) *</label>
              <input
                required
                type="number"
                min="1"
                value={instructorId}
                onChange={(e) => setInstructorId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="ID pracownika z bazy"
              />
              <p className="text-xs text-slate-400 mt-1">Wpisz ID dowolnego pracownika (np. 1 lub 2).</p>
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Zapisywanie..." : <><Save className="w-5 h-5" /> Zapisz zajęcia</>}
          </button>
        </div>
      </form>
    </div>
  );
}
