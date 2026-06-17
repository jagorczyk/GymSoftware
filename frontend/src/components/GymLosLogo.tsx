import React from "react";

export function GymLosLogo({ className = "w-16 h-16 text-primary-500" }: { className?: string }) {
  // Use a relative/absolute path for public assets. We use Tailwind's dark: mode to switch.
  // The 'className' is passed from parent components to control sizing.
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {/* Jasne logo dla jasnego motywu (widoczne tylko w light mode) */}
      <img 
        src="/logo-light.png" 
        alt="GymLos" 
        className="w-full h-full object-contain block dark:hidden drop-shadow-sm rounded-lg" 
      />
      {/* Ciemne logo dla ciemnego motywu (widoczne tylko w dark mode) */}
      <img 
        src="/logo-dark.png" 
        alt="GymLos" 
        className="w-full h-full object-contain hidden dark:block drop-shadow-md rounded-lg" 
      />
    </div>
  );
}
