import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="md:w-[45%] bg-slate-900 text-white flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden shrink-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="z-10 text-center max-w-md mx-auto">
          <img
            src="/logo-light.png"
            alt="Gymlos"
            className="w-28 h-28 md:w-36 md:h-36 mx-auto mb-8 object-contain"
          />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">{title}</h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="md:w-[55%] flex items-center justify-center p-8 dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_2px_20px_-3px_rgba(6,81,237,0.1)] border-2 border-slate-100 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-50 dark:bg-primary-950/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
