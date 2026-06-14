import { useEffect, useState } from "react";
import { Star, MessageSquare, Calendar, ChevronRight } from "lucide-react";
import { getClassRatingsSummary, getClassRatings, type ClassRatingSummary, type ClassRatingView } from "../../api";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader } from "../../components/PageHeader";
import { secondaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}`}
        />
      ))}
      <span className="ml-2 font-bold text-slate-700 dark:text-slate-300">{rating.toFixed(1)}</span>
    </div>
  );
}

export function OwnerClassRatings({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, setError } = ctx;
  const [summaries, setSummaries] = useState<ClassRatingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRatingSummary | null>(null);
  const [ratings, setRatings] = useState<ClassRatingView[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  useEffect(() => {
    if (!selectedGymId) return;
    setLoading(true);
    getClassRatingsSummary(auth, Number(selectedGymId))
      .then(setSummaries)
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się pobrać zestawienia ocen"))
      .finally(() => setLoading(false));
  }, [auth, selectedGymId, setError]);

  async function handleSelectClass(cls: ClassRatingSummary) {
    setSelectedClass(cls);
    setRatingsLoading(true);
    try {
      const data = await getClassRatings(auth, Number(selectedGymId), cls.classId);
      setRatings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać szczegółów ocen");
    } finally {
      setRatingsLoading(false);
    }
  }

  if (!selectedGymId) return <SelectGymPrompt />;

  if (selectedClass) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedClass(null)}
          className={secondaryButtonClassName}
        >
          Powrót do listy zajęć
        </button>
        <PageHeader
          title={`Oceny: ${selectedClass.className}`}
          subtitle={`Instruktor: ${selectedClass.instructorName || "Brak danych"}`}
        />
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-slate-900 dark:text-white">
              {selectedClass.avgRating.toFixed(1)}
            </div>
            <div>
              <StarRating rating={selectedClass.avgRating} />
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Na podstawie {selectedClass.ratingCount} ocen
              </div>
            </div>
          </div>
        </div>

        {ratingsLoading ? (
          <LoadingState message="Ładowanie ocen..." />
        ) : ratings.length === 0 ? (
          <p className="text-slate-500">Brak szczegółowych ocen.</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{r.guestName}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.comment && (
                  <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl flex gap-3">
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p>{r.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oceny Zajęć"
        subtitle="Zestawienie ocen klientów dla poszczególnych zajęć grupowych."
      />
      {loading ? (
        <LoadingState message="Ładowanie zestawienia..." />
      ) : summaries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400">
          Brak ocen zajęć.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((s) => (
            <div
              key={s.classId}
              onClick={() => handleSelectClass(s)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{s.className}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{s.instructorName}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div>
                  <StarRating rating={s.avgRating} />
                  <span className="text-xs text-slate-400 mt-1 block">
                    Ocen: {s.ratingCount}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
