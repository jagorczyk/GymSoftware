import { FormEvent, useEffect, useMemo, useState } from "react";
import { Inbox, Mail, MessageSquare, Send, CheckCircle2, RotateCcw } from "lucide-react";
import { useToast } from "./Toast";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { primaryButtonClassName, secondaryButtonClassName } from "./formStyles";
import {
  StaffSupportApi,
  SupportThreadDetail,
  SupportThreadSummary,
  formatSupportDate,
} from "../supportApi";

type SupportInboxProps = {
  gymId: number;
  api: StaffSupportApi;
  title?: string;
  subtitle?: string;
};

export function SupportInbox({
  gymId,
  api,
  title = "Skrzynka wiadomości",
  subtitle = "Wiadomości od klientów siłowni",
}: SupportInboxProps) {
  const { showError, showSuccess } = useToast();
  const [threads, setThreads] = useState<SupportThreadSummary[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  const filteredThreads = useMemo(() => {
    if (statusFilter === "ALL") return threads;
    return threads.filter((t) => t.status === statusFilter);
  }, [threads, statusFilter]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + t.unreadCount, 0),
    [threads]
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.listThreads(gymId);
        setThreads(data);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Błąd ładowania wiadomości");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gymId, api, showError]);

  async function openThread(threadId: number) {
    setLoadingThread(true);
    try {
      const detail = await api.getThread(gymId, threadId);
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
    if (!selectedThread || !replyBody.trim()) return;
    setSending(true);
    try {
      const updated = await api.reply(gymId, selectedThread.id, replyBody.trim());
      setSelectedThread(updated);
      setReplyBody("");
      setThreads((prev) =>
        prev.map((t) =>
          t.id === updated.id
            ? {
                ...t,
                status: updated.status,
                lastMessagePreview: updated.messages[updated.messages.length - 1]?.body.slice(0, 120) ?? "",
                updatedAt: updated.updatedAt,
                unreadCount: 0,
              }
            : t
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
      showSuccess("Odpowiedź wysłana");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd wysyłania");
    } finally {
      setSending(false);
    }
  }

  async function toggleThreadStatus() {
    if (!selectedThread) return;
    try {
      const updated =
        selectedThread.status === "OPEN"
          ? await api.closeThread(gymId, selectedThread.id)
          : await api.reopenThread(gymId, selectedThread.id);
      setSelectedThread(updated);
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t)));
      showSuccess(updated.status === "CLOSED" ? "Rozmowa zamknięta" : "Rozmowa ponownie otwarta");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd zmiany statusu");
    }
  }

  if (loading) {
    return <LoadingState message="Ładowanie skrzynki..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Inbox className="w-8 h-8 text-primary-500" />
            {title}
            {unreadTotal > 0 && (
              <span className="text-sm font-bold bg-primary-500 text-white px-2.5 py-0.5 rounded-full">
                {unreadTotal}
              </span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          {(["ALL", "OPEN", "CLOSED"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                statusFilter === filter
                  ? "bg-primary-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {filter === "ALL" ? "Wszystkie" : filter === "OPEN" ? "Otwarte" : "Zamknięte"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[520px]">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200">
            Rozmowy ({filteredThreads.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredThreads.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Mail className="w-8 h-8" />}
                  title="Brak wiadomości"
                  description="Gdy klient wyśle wiadomość, pojawi się tutaj."
                />
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => openThread(thread.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    selectedThread?.id === thread.id ? "bg-primary-50 dark:bg-primary-900/20" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{thread.guestName}</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{thread.subject}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{thread.lastMessagePreview}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {thread.unreadCount > 0 && (
                        <span className="inline-block bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-1">
                          {thread.unreadCount}
                        </span>
                      )}
                      <p className="text-xs text-slate-400">{formatSupportDate(thread.updatedAt)}</p>
                      {thread.status === "CLOSED" && (
                        <span className="text-xs text-slate-500 font-medium">Zamknięta</span>
                      )}
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
                description="Kliknij wiadomość z listy, aby zobaczyć szczegóły i odpowiedzieć."
              />
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedThread.subject}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selectedThread.guestName}
                    {selectedThread.guestEmail ? ` · ${selectedThread.guestEmail}` : ""}
                  </p>
                </div>
                <button type="button" onClick={toggleThreadStatus} className={secondaryButtonClassName}>
                  {selectedThread.status === "OPEN" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Zamknij rozmowę
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Otwórz ponownie
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.senderSide === "STAFF"
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
                    placeholder="Napisz odpowiedź..."
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    className={primaryButtonClassName}
                  >
                    <Send className="w-4 h-4" />
                    Wyślij
                  </button>
                </form>
              ) : (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 text-center">
                  Ta rozmowa jest zamknięta. Otwórz ją ponownie, aby odpowiedzieć.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
