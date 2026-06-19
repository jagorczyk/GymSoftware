import React from "react";

export function GymLosLogo({ className = "" }: { className?: string }) {
  // Dla div z mask-image musimy wymusić aspect-ratio, inaczej 'w-auto' spowoduje szerokość 0.
  let defaultClass = className.includes("w-") ? className : `w-16 h-16 ${className}`;
  if (defaultClass.includes("w-auto")) {
    defaultClass = defaultClass.replace("w-auto", "aspect-square");
  }
  
  const colorClass = className.includes("text-") ? "bg-current" : "bg-primary-500 dark:bg-white";

  return (
    <div 
      className={`${defaultClass} ${colorClass} inline-block transition-colors duration-300`}
      style={{
        maskImage: `url(/logo-icon-alpha.png)`,
        WebkitMaskImage: `url(/logo-icon-alpha.png)`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
      title="Gymlos"
    />
  );
}
