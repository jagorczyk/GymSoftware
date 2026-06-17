import React from "react";

export function GymLosLogo({ className = "w-16 h-16 text-primary-500" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Główny kształt litery 'G' płynnie przechodzący w linię pulsu EKG */}
      <path 
        d="M 75 25 
           A 35 35 0 1 0 85 50 
           L 75 50 
           L 68 25 
           L 53 75 
           L 46 50 
           L 35 50" 
        fill="none"
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#neonGlow)"
      />
      
      {/* Dekoracyjne kropki (Tech/Cyber accent) */}
      <circle cx="75" cy="25" r="4" fill="currentColor" />
      <circle cx="35" cy="50" r="4" fill="currentColor" />
    </svg>
  );
}
