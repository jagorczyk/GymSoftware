import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  message?: string;
  variant?: "spinner" | "skeleton";
};

export function LoadingState(props: LoadingStateProps) {
  const { message = "Ładowanie...", variant = "spinner" } = props;

  if (variant === "skeleton") {
    return (
      <div className="flex flex-col space-y-2" role="status" aria-busy="true" aria-label={message}>
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse rounded-xl" />
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse rounded-xl" />
        <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 motion-safe:animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center gap-4 text-slate-600 dark:text-slate-400" role="status" aria-busy="true">
      <Loader2 className="w-10 h-10 motion-safe:animate-spin text-primary-500" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
