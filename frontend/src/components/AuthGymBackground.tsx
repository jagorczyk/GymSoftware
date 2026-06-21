export function AuthGymBackground() {
  return (
    <div className="auth-gym-bg absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="auth-gym-spotlight absolute inset-0" />
      <div className="auth-gym-floor absolute inset-x-0 bottom-0 h-[55%]" />

      <div className="auth-gym-float auth-gym-float-1 absolute left-[8%] top-[18%] opacity-[0.14]">
        <DumbbellIcon className="w-16 h-16 text-white rotate-[-24deg]" />
      </div>
      <div className="auth-gym-float auth-gym-float-2 absolute right-[12%] top-[28%] opacity-[0.1]">
        <DumbbellIcon className="w-24 h-24 text-white rotate-[18deg]" />
      </div>
      <div className="auth-gym-float auth-gym-float-3 absolute left-[22%] bottom-[32%] opacity-[0.08]">
        <KettlebellIcon className="w-20 h-20 text-white" />
      </div>
      <div className="auth-gym-float auth-gym-float-4 absolute right-[20%] bottom-[38%] opacity-[0.12]">
        <PlateIcon className="w-14 h-14 text-white" />
      </div>

      <svg
        className="absolute inset-x-0 bottom-0 w-full h-[48%] text-white/[0.07]"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        fill="currentColor"
      >
        <rect x="60" y="300" width="18" height="100" rx="4" />
        <rect x="722" y="300" width="18" height="100" rx="4" />
        <rect x="78" y="250" width="640" height="14" rx="7" />
        <circle cx="90" cy="257" r="34" />
        <circle cx="90" cy="257" r="20" fill="#0f172a" />
        <circle cx="710" cy="257" r="34" />
        <circle cx="710" cy="257" r="20" fill="#0f172a" />

        <g className="auth-gym-lifter">
          <ellipse cx="400" cy="355" rx="70" ry="10" fill="currentColor" opacity="0.35" />
          <rect x="382" y="250" width="36" height="95" rx="16" />
          <circle cx="400" cy="228" r="22" />
          <rect x="352" y="265" width="28" height="12" rx="6" transform="rotate(-24 366 271)" />
          <rect x="420" y="265" width="28" height="12" rx="6" transform="rotate(24 434 271)" />
          <g className="auth-gym-lift-bar">
            <rect x="350" y="210" width="100" height="10" rx="5" />
            <circle cx="345" cy="215" r="14" />
            <circle cx="455" cy="215" r="14" />
          </g>
        </g>

        <rect x="120" y="180" width="8" height="220" rx="3" opacity="0.65" />
        <rect x="672" y="180" width="8" height="220" rx="3" opacity="0.65" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="128" y={190 + i * 38} width="56" height="8" rx="4" opacity="0.55" />
        ))}
      </svg>

      <div className="auth-gym-particles absolute inset-0">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="auth-gym-particle absolute rounded-full bg-white"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-slate-900/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.55)_100%)]" />
    </div>
  );
}

const PARTICLES = [
  { id: 1, left: "12%", top: "22%", size: 3, delay: "0s", duration: "7s" },
  { id: 2, left: "78%", top: "16%", size: 2, delay: "1.2s", duration: "9s" },
  { id: 3, left: "64%", top: "44%", size: 4, delay: "0.4s", duration: "8s" },
  { id: 4, left: "28%", top: "58%", size: 2, delay: "2s", duration: "10s" },
  { id: 5, left: "88%", top: "52%", size: 3, delay: "1.8s", duration: "6s" },
  { id: 6, left: "46%", top: "30%", size: 2, delay: "0.8s", duration: "11s" },
];

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden>
      <rect x="4" y="26" width="12" height="12" rx="3" />
      <rect x="48" y="26" width="12" height="12" rx="3" />
      <rect x="16" y="30" width="32" height="4" rx="2" />
    </svg>
  );
}

function KettlebellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden>
      <path d="M24 18c0-8 16-8 16 0v6c10 2 14 10 14 18 0 12-10 20-22 20S10 54 10 42c0-8 4-16 14-18v-6z" />
      <rect x="28" y="44" width="8" height="8" rx="2" fill="#0f172a" />
    </svg>
  );
}

function PlateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden>
      <circle cx="32" cy="32" r="28" />
      <circle cx="32" cy="32" r="10" fill="#0f172a" />
    </svg>
  );
}
