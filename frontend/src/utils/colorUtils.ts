export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function generateThemeVars(hex: string): Record<string, string> {
  // If it's empty or invalid, fallback to blue
  if (!hex || !/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
    hex = "#2155e5";
  }

  const { h, s, l } = hexToHsl(hex);
  
  return {
    "--color-primary-50": `hsl(${h}, ${s}%, 96%)`,
    "--color-primary-100": `hsl(${h}, ${s}%, 91%)`,
    "--color-primary-200": `hsl(${h}, ${s}%, 82%)`,
    "--color-primary-300": `hsl(${h}, ${s}%, 72%)`,
    "--color-primary-400": `hsl(${h}, ${s}%, 62%)`,
    "--color-primary-500": hex, // Base color
    "--color-primary-600": `hsl(${h}, ${s}%, ${Math.max(0, l - 10)}%)`,
    "--color-primary-700": `hsl(${h}, ${s}%, ${Math.max(0, l - 20)}%)`,
    "--color-primary-800": `hsl(${h}, ${s}%, ${Math.max(0, l - 30)}%)`,
    "--color-primary-900": `hsl(${h}, ${s}%, ${Math.max(0, l - 40)}%)`,
    "--color-primary-950": `hsl(${h}, ${s}%, ${Math.max(0, l - 50)}%)`,
  };
}

export const PRESET_THEMES = [
  { label: "Niebieski", hex: "#2155e5" },
  { label: "Różowy", hex: "#e11d48" },
  { label: "Szmaragdowy", hex: "#059669" },
  { label: "Fioletowy", hex: "#7c3aed" },
  { label: "Bursztynowy", hex: "#d97706" },
];
