import { ReactElement, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Users,
  BadgeCheck,
  Lock,
  History,
  Store,
  Ticket,
  KeyRound,
  MapPin,
  ListPlus,
  CalendarDays,
  CalendarClock,
  Wallet,
  Bell,
  LineChart,
  Award,
} from "lucide-react";
import { useAuth } from "./authContext";
import { useEmployeePermissions } from "./employeePermissionsContext";
import { canAccessEmployeeRoute, hasEmployeePermission } from "./permissions";
import { useSelectedGymBrand } from "./selectedGymBrandContext";
import { useAppGymSelector } from "./appGymSelectorContext";

export function AppShell() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { permissions: employeePermissions } = useEmployeePermissions();
  const { brandName, setBrandName } = useSelectedGymBrand();
  const { state: gymSelector } = useAppGymSelector();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const displayName = brandName.trim();

  const employeeNavItems = useMemo(
    () =>
      [
        { label: "Dashboard", to: "/employee/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Klienci", to: "/employee/guests", icon: <Users className="w-5 h-5" /> },
        { label: "Kluczyki", to: "/employee/lockers", icon: <KeyRound className="w-5 h-5" /> },
        { label: "Oferta", to: "/employee/pass-types", icon: <ListPlus className="w-5 h-5" /> },
        { label: "Obecni", to: "/employee/present", icon: <MapPin className="w-5 h-5" /> },
        { label: "Terminarz", to: "/employee/schedule", icon: <CalendarDays className="w-5 h-5" /> },
        { label: "Grafik", to: "/employee/work-schedule", icon: <CalendarClock className="w-5 h-5" /> },
      ].filter((item) => {
        if (item.to === "/employee/lockers") {
          return (
            hasEmployeePermission(employeePermissions, "MANAGE_LOCKERS") ||
            hasEmployeePermission(employeePermissions, "CREATE_LOCKERS")
          );
        }
        return canAccessEmployeeRoute(item.to, employeePermissions);
      }),
    [employeePermissions]
  );

  const clientNavItems = useMemo(
    () => [
      { label: "Dashboard", to: "/client/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "Dołącz do siłowni", to: "/client/gyms/join", icon: <Store className="w-5 h-5" /> },
    ],
    []
  );

  const navItems =
    auth?.role === "OWNER"
      ? [
          { label: "Podsumowanie", to: "/owner/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Siłownie", to: "/owner/gyms", icon: <Store className="w-5 h-5" /> },
          { label: "Klienci", to: "/owner/guests", icon: <Users className="w-5 h-5" /> },
          { label: "Pracownicy", to: "/owner/employees", icon: <BadgeCheck className="w-5 h-5" /> },
          { label: "Rangi", to: "/owner/ranks", icon: <Award className="w-5 h-5" /> },
          { label: "Oferta", to: "/owner/pass-types", icon: <ListPlus className="w-5 h-5" /> },
          { label: "Karnety", to: "/owner/passes", icon: <Ticket className="w-5 h-5" /> },
          { label: "Szafki", to: "/owner/lockers", icon: <Lock className="w-5 h-5" /> },
          { label: "Terminarz", to: "/owner/schedule", icon: <CalendarDays className="w-5 h-5" /> },
          { label: "Grafik", to: "/owner/work-schedule", icon: <CalendarClock className="w-5 h-5" /> },
          { label: "Raport sprzedaży", to: "/owner/sales-report", icon: <Wallet className="w-5 h-5" /> },
          { label: "Analityka", to: "/owner/analytics", icon: <LineChart className="w-5 h-5" /> },
          { label: "Powiadomienia", to: "/owner/notifications", icon: <Bell className="w-5 h-5" /> },
          { label: "Historia", to: "/owner/history", icon: <History className="w-5 h-5" /> },
        ]
      : auth?.role === "GUEST"
      ? clientNavItems
      : employeeNavItems;

  function handleLogout() {
    setBrandName("");
    logout();
    navigate("/login", { replace: true });
  }

  const gymSelectControl =
    gymSelector.gyms.length > 0 ? (
      <select
        value={gymSelector.selectedGymId === "" ? "" : String(gymSelector.selectedGymId)}
        onChange={(e) => {
          const id = Number(e.target.value);
          if (!Number.isNaN(id)) gymSelector.onSelectGym(id);
        }}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 p-2.5 outline-none"
        aria-label="Wybierz siłownię"
      >
        {gymSelector.gyms.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-100 transition-transform duration-300 ease-in-out
        ${drawerOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        flex flex-col
      `}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-100/50 gap-4 min-w-0">
          <div className="text-primary-500 bg-primary-50 p-2.5 rounded-2xl shrink-0 border border-primary-100 shadow-sm">
            <Dumbbell className="w-6 h-6" />
          </div>
          {displayName ? (
            <span
              className="font-extrabold text-xl text-slate-900 tracking-tight truncate min-w-0 flex-1"
              title={displayName}
            >
              {displayName}
            </span>
          ) : null}
          <button
            type="button"
            className="ml-auto lg:hidden text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {gymSelectControl && (
          <div className="px-5 py-4 border-b border-slate-100/50">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
              Wybrana siłownia
            </label>
            {gymSelectControl}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <div className={`${isActive ? "text-primary-600" : "text-slate-400"}`}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100/50">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-4 rounded-2xl font-bold text-slate-600 bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all group"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
            Wyloguj się
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 font-bold text-slate-900 min-w-0 max-w-[60%]">
            <Dumbbell className="w-5 h-5 text-primary-500 shrink-0" />
            {displayName ? (
              <span className="truncate" title={displayName}>
                {displayName}
              </span>
            ) : null}
          </div>
          {gymSelector.gyms.length > 0 ? (
            <select
              value={gymSelector.selectedGymId === "" ? "" : String(gymSelector.selectedGymId)}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!Number.isNaN(id)) gymSelector.onSelectGym(id);
              }}
              className="max-w-[42%] text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
              aria-label="Wybierz siłownię"
            >
              {gymSelector.gyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="w-10" />
          )}
        </header>

        <div className="flex-1 overflow-x-hidden p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
