import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  message?: string;
  variant?: "spinner" | "skeleton";
};

export function LoadingState(props: LoadingStateProps) {
  const { message = "Ładowanie...", variant = "spinner" } = props;

  if (variant === "skeleton") {
    return (
      <div className="flex flex-col space-y-2">
        <div className="h-12 w-full bg-slate-200 animate-pulse rounded-xl"></div>
        <div className="h-32 w-full bg-slate-200 animate-pulse rounded-xl"></div>
        <div className="h-32 w-full bg-slate-200 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center gap-4 text-slate-500">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
