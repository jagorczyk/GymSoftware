import React from "react";
import { useTenant } from "../tenantContext";
import { Link } from "react-router-dom";

export function TenantLandingPage() {
  const { tenant } = useTenant();

  if (!tenant) return <div>Tenant not found</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-gray-900">
      <div 
        className="w-full max-w-md p-8 rounded-xl shadow-lg flex flex-col items-center gap-6"
        style={{ borderTop: `6px solid var(--theme-color)` }}
      >
        <h1 className="text-3xl font-bold text-center">Witaj w {tenant.name}</h1>
        <p className="text-gray-600 text-center">Wybierz jedną z opcji aby kontynuować:</p>

        <div className="flex flex-col gap-4 w-full">
          <Link
            to="/login"
            className="w-full text-center py-3 rounded-lg text-white font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--theme-color)" }}
          >
            Zaloguj się
          </Link>

          <Link
            to="/register"
            className="w-full text-center py-3 rounded-lg border-2 font-semibold transition-colors hover:bg-gray-100"
            style={{ borderColor: "var(--theme-color)", color: "var(--theme-color)" }}
          >
            Zarejestruj nowe konto Klienta
          </Link>
        </div>
      </div>
    </div>
  );
}
