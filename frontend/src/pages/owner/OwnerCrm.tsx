import { FormEvent, useEffect, useState } from "react";
import { OwnerContext } from "./types";
import { createEmailCampaign, EmailCampaignView, getEmailCampaigns } from "../../api";
import { Users, Mail, Plus, X, CalendarClock, Target, Send, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";
import { CampaignImageUpload } from "../../components/CampaignImageUpload";
import { PageHeader } from "../../components/PageHeader";
import {
  focusRingClassName,
  inputClassName,
  labelClassName,
  panelSurfaceClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../../components/formStyles";

export function OwnerCrm({ ctx }: { ctx: OwnerContext }) {
  const { selectedGymId } = ctx;
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  
  const [campaigns, setCampaigns] = useState<EmailCampaignView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("ALL_GUESTS");
  const [scheduledAt, setScheduledAt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchCampaigns() {
      if (!selectedGymId || !auth) return;
      setLoading(true);
      try {
        const data = await getEmailCampaigns(auth, Number(selectedGymId));
        setCampaigns(data);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Błąd ładowania kampanii");
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [selectedGymId, auth]);

  async function handleCreateCampaign(e: FormEvent) {
    e.preventDefault();
    if (!selectedGymId || !auth) return;
    setSending(true);
    try {
      const newCamp = await createEmailCampaign(auth, Number(selectedGymId), {
        subject,
        body,
        targetSegment: segment,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        imageUrl,
      });
      setCampaigns([newCamp, ...campaigns]);
      showSuccess("Kampania została zaplanowana/wysłana!");
      setIsModalOpen(false);
      setSubject("");
      setBody("");
      setScheduledAt("");
      setImageUrl(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd wysyłania kampanii");
    } finally {
      setSending(false);
    }
  }

  function getSegmentLabel(seg: string) {
    switch (seg) {
      case "ALL_GUESTS": return "Wszyscy Klienci";
      case "ACTIVE_PASSES": return "Aktywne Karnety";
      case "EXPIRED_PASSES": return "Wygasłe Karnety";
      case "NO_PASS": return "Brak Karnetu";
      default: return seg;
    }
  }

  if (!selectedGymId) {
    return (
      <div className={`flex justify-center items-center h-64 text-slate-600 dark:text-slate-400 ${panelSurfaceClassName}`}>
        Wybierz siłownię, aby zarządzać marketingiem.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing i CRM"
        action={
          <button type="button" onClick={() => setIsModalOpen(true)} className={primaryButtonClassName}>
            <Plus className="w-5 h-5" />
            Nowa kampania
          </button>
        }
      />

      <div className={`p-6 flex flex-col sm:flex-row gap-4 items-start bg-primary-50/80 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-2xl`}>
        <div className="bg-primary-100 dark:bg-primary-800/30 p-3 rounded-2xl text-primary-600 dark:text-primary-400 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Personalizacja wiadomości</h3>
          <p className="text-slate-600 dark:text-slate-400 mt-1 mb-3">
            Możesz użyć zmiennych, pogrubień oraz własnych zdjęć. W mailu kampanii nie dodajemy żadnych grafik systemowych — tylko to, co sam wgrasz.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
              <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{imie}}"}</code> - Imię klienta
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
              <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{nazwisko}}"}</code> - Nazwisko klienta
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
              <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{email}}"}</code> - Adres e-mail
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
              <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{telefon}}"}</code> - Numer telefonu
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
              <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"**tekst**"}</code> - Pogrubiony tekst
            </span>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden ${panelSurfaceClassName}`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historia kampanii</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400">Ładowanie kampanii...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Mail className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Brak kampanii</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
              Nie wysłałeś jeszcze żadnej wiadomości e-mail do swoich klientów. Kliknij "Nowa Kampania", aby zacząć.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      {camp.subject}
                      {camp.status === "SENT" ? (
                        <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Wysłano
                        </span>
                      ) : camp.status === "SCHEDULED" ? (
                        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                          <CalendarClock className="w-3 h-3" /> ZAPLANOWANO ({camp.scheduledAt ? new Date(camp.scheduledAt).toLocaleString() : ''})
                        </span>
                      ) : (
                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                          {camp.status}
                        </span>
                      )}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 line-clamp-1">{camp.body}</p>
                    {camp.imageUrl ? (
                      <img
                        src={camp.imageUrl}
                        alt=""
                        className="mt-3 h-20 w-auto max-w-full rounded-xl border border-slate-200 dark:border-slate-700 object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      <span>Segment: <strong className="text-slate-700 dark:text-slate-300">{getSegmentLabel(camp.targetSegment)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4" />
                      <span>{new Date(camp.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !sending && setIsModalOpen(false)} />
          <div className={`relative w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] ${panelSurfaceClassName}`}>
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-primary-500" aria-hidden="true" />
                Utwórz kampanię mailową
              </h2>
              <button 
                type="button"
                onClick={() => !sending && setIsModalOpen(false)}
                className={`text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-2 rounded-lg ${focusRingClassName}`}
                aria-label="Zamknij"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className={labelClassName}>Grupa docelowa (segment)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="w-5 h-5 text-slate-400" aria-hidden="true" />
                  </div>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className={`${inputClassName} pl-12 appearance-none`}
                    disabled={sending}
                  >
                    <option value="ALL_GUESTS">Wszyscy Klienci</option>
                    <option value="ACTIVE_PASSES">Klienci z aktywnym karnetem</option>
                    <option value="EXPIRED_PASSES">Klienci z wygasłym karnetem</option>
                    <option value="NO_PASS">Klienci bez karnetu</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClassName}>Temat wiadomości</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={inputClassName}
                  placeholder="np. Odbierz darmowy trening!"
                  disabled={sending}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClassName}>Zdjęcie kampanii (opcjonalnie)</label>
                <CampaignImageUpload
                  imageUrl={imageUrl}
                  onImageUrlChange={setImageUrl}
                  disabled={sending}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClassName}>Treść wiadomości</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className={`${inputClassName} resize-y min-h-[150px]`}
                  placeholder="Napisz coś interesującego..."
                  disabled={sending}
                />
                <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/30">
                  <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400 mb-2 font-semibold text-sm">
                    <Info className="w-4 h-4" />
                    Formatowanie i zmienne (placeholdery):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                      <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{imie}}"}</code> - Imię klienta
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                      <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{nazwisko}}"}</code> - Nazwisko klienta
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                      <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{email}}"}</code> - Adres e-mail
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                      <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"{{telefon}}"}</code> - Numer telefonu
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800/50 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                      <code className="text-primary-600 dark:text-primary-400 font-bold mr-1.5">{"**tekst**"}</code> - Pogrubiony tekst
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClassName}>Data i godzina wysyłki (opcjonalnie)</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={inputClassName}
                  disabled={sending}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={sending}
                  className={secondaryButtonClassName}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={sending || !subject.trim() || !body.trim()}
                  className={`${primaryButtonClassName} disabled:opacity-50`}
                >
                  {sending ? (
                    <>Wysyłanie...</>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Wyślij Kampanię
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
