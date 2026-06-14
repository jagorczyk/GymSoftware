import { FormEvent, useEffect, useState } from "react";
import { OwnerContext } from "./types";
import { createEmailCampaign, EmailCampaignView, getEmailCampaigns } from "../../api";
import { Megaphone, Users, Mail, Plus, X, CalendarClock, Target, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";

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
      });
      setCampaigns([newCamp, ...campaigns]);
      showSuccess("Kampania została zaplanowana/wysłana!");
      setIsModalOpen(false);
      setSubject("");
      setBody("");
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
      <div className="flex justify-center items-center h-64 text-slate-500">
        Wybierz siłownię, aby zarządzać marketingiem.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary-500" />
            Marketing i CRM
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Zarządzaj kampaniami mailowymi i docieraj do klientów</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-primary-500/30"
        >
          <Plus className="w-5 h-5" />
          Nowa Kampania
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historia kampanii</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Ładowanie kampanii...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Mail className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Brak kampanii</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
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
                      ) : (
                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                          {camp.status}
                        </span>
                      )}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-1">{camp.body}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2 text-sm text-slate-500 dark:text-slate-400">
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
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-6 h-6 text-primary-500" />
                Utwórz Kampanię Mailową
              </h2>
              <button 
                onClick={() => !sending && setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Grupa docelowa (Segment)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-primary-500 outline-none font-medium text-slate-900 dark:text-white appearance-none"
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
                <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Temat wiadomości</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-primary-500 outline-none font-medium text-slate-900 dark:text-white"
                  placeholder="np. Odbierz darmowy trening!"
                  disabled={sending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Treść wiadomości</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-primary-500 outline-none font-medium text-slate-900 dark:text-white resize-y min-h-[150px]"
                  placeholder="Napisz coś interesującego..."
                  disabled={sending}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={sending}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={sending || !subject.trim() || !body.trim()}
                  className="px-8 py-3 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 flex items-center gap-2"
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
