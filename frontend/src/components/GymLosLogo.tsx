import React from "react";

export function GymLosLogo({ className = "w-16 h-16 text-primary-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g fill="currentColor">
        <rect x="15" y="25" width="15" height="50" rx="4" />
        <rect x="5" y="35" width="10" height="30" rx="3" />
        
        <rect x="30" y="45" width="40" height="10" rx="2" />
        
        <rect x="70" y="25" width="15" height="50" rx="4" />
        <rect x="85" y="35" width="10" height="30" rx="3" />
      </g>
      
      <text 
        x="50" 
        y="105" 
        textAnchor="middle" 
        fontSize="24" 
        fontWeight="800" 
        fontFamily="sans-serif" 
        fill="currentColor"
        letterSpacing="1"
      >
        GymLos
      </text>
    </svg>
  );
}
