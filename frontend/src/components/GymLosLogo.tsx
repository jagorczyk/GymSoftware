import React from "react";

export function GymLosLogo({ className = "w-16 h-16" }: { className?: string }) {
  // Usuwamy text-primary-500 z domyślnej klasy, ponieważ teraz to są obrazki, nie SVG z currentColor
  const defaultClass = className.includes("w-") ? className : `w-16 h-16 ${className}`;

  return (
    <>
      <img 
        src="/logo-light.png" 
        alt="Gymlos Logo" 
        className={`${defaultClass} block dark:hidden object-contain`} 
      />
      <img 
        src="/logo-dark.png" 
        alt="Gymlos Logo" 
        className={`${defaultClass} hidden dark:block object-contain`} 
      />
    </>
  );
}
