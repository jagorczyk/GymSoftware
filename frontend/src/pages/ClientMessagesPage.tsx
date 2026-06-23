import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Plus, Send, X } from "lucide-react";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import { primaryButtonClassName } from "../components/formStyles";
import { getClientGyms, ClientGymView } from "../clientApi";
import {
  createClientSupportThread,
  getClientSupportThread,
  getClientSupportThreads,
  replyToClientSupportThread,
  SupportThreadDetail,
  SupportThreadSummary,
  formatSupportDate,
} from "../supportApi";

export function ClientMessagesPage() {
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const [gyms, setGyms] = useState<ClientGymView[]>([]);
  const [threads, setThreads] = useState<SupportThreadSummary[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeGymId, setComposeGymId] = useState<number | "">("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  useEffect(() => {
    if (!auth) return;
    const currentAuth = auth;
    async function load() {
      setLoading(true);
      try {
        const [gymData, threadData] = await Promise.all([
          getClientGyms(currentAuth),
          getClientSupportThreads(currentAuth),
        ]);
        setGyms(gymData);
        setThreads(threadData);
        if (gymData.length === 1) {
          setComposeGymId(gymData[0].id);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : "Błąd ładowania");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth, showError]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + t.unreadCount, 0),
    [threads]
  );

  async function openThread(gymId: number, threadId: number) {
    if (!auth) return;
    setLoadingThread(true);
    try {
      const detail = await getClientSupportThread(auth, gymId, threadId);
      setSelectedThread(detail);
      setReplyBody("");
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd otwierania rozmowy");
    } finally {
      setLoadingThread(false);
    }
  }

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!auth || !selectedThread || !replyBody.trim()) return;
    setSending(true);
    try {
      const updated = await replyToClientSupportThread(
        auth,
        selectedThread.gymId,
        selectedThread.id,
        replyBody.trim()
      );
      setSelectedThread(updated);
      setReplyBody("");
      setThreads((prev) =>
        prev
          .map((t) =>
            t.id === updated.id
              ? {
                  ...t,
                  status: updated.status,
                  lastMessagePreview: updated.messages[updated.messages.length - 1]?.body.slice(0, 120) ?? "",
                  updatedAt: updated.updatedAt,
                  unreadCount: 0,
                }
              : t
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
      showSuccess("Wiadomość wysłana");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd wysyłania");
    } finally {
      setSending(false);
    }
  }

  async function handleCompose(e: FormEvent) {
    e.preventDefault();
    if (!auth || composeGymId === "" || !composeSubject.trim() || !composeBody.trim()) return;
    setSending(true);
    try {
      const created = await createClientSupportThread(auth, Number(composeGymId), {
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });
      setThreads((prev) => [
        {
          id: created.id,
          gymId: created.gymId,
          gymName: created.gymName,
          guestId: created.guestId,
          guestName: created.guestName,
          guestEmail: created.guestEmail,
          subject: created.subject,
          status: created.status,
          lastMessagePreview: created.messages[0]?.body.slice(0, 120) ?? "",
          updatedAt: created.updatedAt,
          unreadCount: 0,
        },
        ...prev,
      ]);
      setSelectedThread(created);
      setComposeOpen(false);
      setComposeSubject("");
      setComposeBody("");
      showSuccess("Wiadomość wysłana do siłowni");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd wysyłania");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <LoadingState message="Ładowanie wiadomości..." />;
  }

  if (gyms.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Wiadomości"
          subtitle="Napisz do swojej siłowni w sprawie karnetu, zajęć lub innych pytań."
        />
        <EmptyState
          icon={<MessageSquare className="w-10 h-10" />}
          title="Nie jesteś jeszcze klientem żadnej siłowni"
          description="Dołącz do siłowni, aby móc wysyłać wiadomości do obsługi."
          action={
            <Link to="/client/gyms/join" className={primaryButtonClassName}>
              Dołącz do siłowni
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] w-full sm:w-auto">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Wiadomości
            {unreadTotal > 0 && (
              <span className="text-sm font-bold bg-primary-500 text-white px-2.5 py-0.5 rounded-full">
                {unreadTotal}
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Skontaktuj się z obsługą swojej siłowni</p>
        </div>
        <button type="button" onClick={() => setComposeOpen(true)} className={primaryButtonClassName}>
          <Plus className="w-5 h-5" />
          Nowa wiadomość
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[520px]">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200">
            Twoje rozmowy ({threads.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {threads.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8" />}
                  title="Brak wiadomości"
                  description="Wyślij pierwszą wiadomość do siłowni."
                />
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => openThread(thread.gymId, thread.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    selectedThread?.id === thread.id ? "bg-primary-50 dark:bg-primary-900/20" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">{thread.gymName}</p>
                      <p className="font-bold text-slate-900 dark:text-white truncate">{thread.subject}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{thread.lastMessagePreview}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {thread.unreadCount > 0 && (
                        <span className="inline-block bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                          {thread.unreadCount}
                        </span>
                      )}
                      <p className="text-xs text-slate-400">{formatSupportDate(thread.updatedAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col overflow-hidden">
          {loadingThread ? (
            <LoadingState message="Otwieranie rozmowy..." />
          ) : !selectedThread ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={<MessageSquare className="w-10 h-10" />}
                title="Wybierz rozmowę"
                description="Kliknij rozmowę z listy lub napisz nową wiadomość."
              />
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedThread.subject}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{selectedThread.gymName}</p>
                {selectedThread.status === "CLOSED" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    Rozmowa została zamknięta przez obsługę.
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.senderSide === "CLIENT"
                        ? "ml-auto bg-primary-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <p className="text-xs font-semibold opacity-80 mb-1">{msg.senderName}</p>
                    <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                    <p className="text-xs opacity-70 mt-2">{formatSupportDate(msg.createdAt)}</p>
                  </div>
                ))}
              </div>

              {selectedThread.status === "OPEN" ? (
                <form onSubmit={handleReply} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Napisz wiadomość..."
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <button type="submit" disabled={sending || !replyBody.trim()} className={primaryButtonClassName}>
                    <Send className="w-4 h-4" />
                    Wyślij
                  </button>
                </form>
              ) : (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 text-center">
                  Rozmowa zamknięta — wyślij nową wiadomość, jeśli potrzebujesz dalszej pomocy.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nowa wiadomość</h3>
              <button type="button" onClick={() => setComposeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCompose} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Siłownia</label>
                <select
                  value={composeGymId}
                  onChange={(e) => setComposeGymId(e.target.value ? Number(e.target.value) : "")}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm"
                >
                  <option value="">Wybierz siłownię</option>
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Temat</label>
                <input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  required
                  maxLength={255}
                  placeholder="np. Pytanie o karnet"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Wiadomość</label>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  required
                  rows={5}
                  placeholder="Opisz swoje pytanie lub problem..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setComposeOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">
                  Anuluj
                </button>
                <button type="submit" disabled={sending} className={primaryButtonClassName}>
                  <Send className="w-4 h-4" />
                  Wyślij
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
