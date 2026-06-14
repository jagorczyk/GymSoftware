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
  QrCode,
  Sun,
  Moon,
  ShoppingCart,
  Package,
  Star,
  Megaphone,
} from "lucide-react";
import { useAuth } from "./authContext";
import { useEmployeePermissions } from "./employeePermissionsContext";
import { canAccessEmployeeRoute, hasEmployeePermission } from "./permissions";
import { useSelectedGymBrand } from "./selectedGymBrandContext";
import { useAppGymSelector } from "./appGymSelectorContext";
import { useTheme } from "./ThemeContext";

export function AppShell() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const { permissions: employeePermissions } = useEmployeePermissions();
  const { brandName, setBrandName } = useSelectedGymBrand();
  const { state: gymSelector } = useAppGymSelector();
  const { theme, toggleTheme } = useTheme();
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
        { label: "Zajęcia", to: "/employee/classes", icon: <CalendarDays className="w-5 h-5" /> },
        { label: "Obecni", to: "/employee/present", icon: <MapPin className="w-5 h-5" /> },
        { label: "Terminarz", to: "/employee/schedule", icon: <CalendarDays className="w-5 h-5" /> },
        { label: "Grafik", to: "/employee/work-schedule", icon: <CalendarClock className="w-5 h-5" /> },
        { label: "Kasa (POS)", to: "/employee/pos", icon: <ShoppingCart className="w-5 h-5" /> },
        { label: "Skaner QR", to: "/employee/qr-scanner", icon: <QrCode className="w-5 h-5" /> },
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
      { label: "Zajęcia", to: "/client/classes", icon: <CalendarDays className="w-5 h-5" /> },
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
          { label: "Magazyn", to: "/owner/products", icon: <Package className="w-5 h-5" /> },
          { label: "Szafki", to: "/owner/lockers", icon: <Lock className="w-5 h-5" /> },
          { label: "Terminarz", to: "/owner/schedule", icon: <CalendarDays className="w-5 h-5" /> },
          { label: "Grafik", to: "/owner/work-schedule", icon: <CalendarClock className="w-5 h-5" /> },
          { label: "Raport sprzedaży", to: "/owner/sales-report", icon: <Wallet className="w-5 h-5" /> },
          { label: "Analityka", to: "/owner/analytics", icon: <LineChart className="w-5 h-5" /> },
          { label: "Marketing i CRM", to: "/owner/crm", icon: <Megaphone className="w-5 h-5" /> },
          { label: "Oceny zajęć", to: "/owner/class-ratings", icon: <Star className="w-5 h-5" /> },
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
        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 p-2.5 outline-none font-medium transition-all"
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
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex transition-colors duration-200 relative overflow-hidden">
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white/95 dark:bg-slate-950/95 lg:bg-white/80 lg:dark:bg-slate-900/60 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-800/40 transition-transform duration-300 ease-in-out lg:bg-cyber-grid-light lg:dark:bg-cyber-grid
          ${drawerOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-200/40 dark:border-slate-800/30 gap-4 min-w-0">
          <div className="text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 p-2.5 rounded-2xl shrink-0 border border-primary-100 dark:border-primary-900/30 shadow-[0_0_15px_rgba(33,85,229,0.1)] glow-box-blue">
            <Dumbbell className="w-6 h-6" />
          </div>
          {displayName ? (
            <span
              className="font-display font-black text-lg text-slate-900 dark:text-slate-100 tracking-tight truncate min-w-0 flex-1 uppercase"
              title={displayName}
            >
              {displayName}
            </span>
          ) : null}
          <button
            type="button"
            className="ml-auto lg:hidden text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-805 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/30 transition-colors"
            onClick={() => setDrawerOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {gymSelectControl && (
          <div className="px-5 py-4 border-b border-slate-200/40 dark:border-slate-800/30 bg-slate-50/30 dark:bg-slate-950/10">
            <label className="text-[10px] font-display font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">
              Wybrana siłownia
            </label>
            {gymSelectControl}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-250 dark:scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl font-display font-bold transition-all border-l-4
                  ${
                    isActive
                      ? "bg-primary-500/10 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 border-primary-500 shadow-sm glow-box-blue"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/40 dark:hover:bg-slate-900/30 hover:text-slate-950 dark:hover:text-slate-100 border-transparent"
                  }
                `}
              >
                <div className={`${isActive ? "text-primary-500 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {item.icon}
                </div>
                <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/30 bg-slate-50/20 dark:bg-slate-950/10 space-y-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl font-display font-bold text-xs text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-sm"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4 text-slate-400" />
                <span>Tryb ciemny</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-yellow-500 animate-spin-slow" />
                <span>Tryb jasny</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl font-display font-bold text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-100 dark:hover:border-rose-900/40 transition-all group cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            Wyloguj się
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden h-16 bg-white dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/60 flex items-center px-4 justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 font-display font-extrabold text-slate-900 dark:text-slate-100 min-w-0 max-w-[60%]">
            <Dumbbell className="w-5 h-5 text-primary-500 shrink-0" />
            {displayName ? (
              <span className="truncate uppercase text-sm tracking-tight" title={displayName}>
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
              className="max-w-[42%] text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 dark:text-white rounded-lg px-2 py-1.5 outline-none"
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
