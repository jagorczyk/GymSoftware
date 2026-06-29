import { ReactElement, useMemo, useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { GymLosLogo } from "./components/GymLosLogo";
import { focusRingClassName } from "./components/formStyles";
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
  Inbox,
  UserCircle,
  CreditCard,
  Banknote,
  Layers,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "./authContext";
import { useEmployeePermissions } from "./employeePermissionsContext";
import { canAccessEmployeeRoute, hasEmployeePermission, type EmployeePermission } from "./permissions";
import { useSelectedGymBrand } from "./selectedGymBrandContext";
import { useAppGymSelector } from "./appGymSelectorContext";
import { useTheme } from "./ThemeContext";
import { SubscriptionExpiredView } from "./components/SubscriptionExpiredView";
import { PRESET_THEMES, generateThemeVars } from "./utils/colorUtils";
import { updateOwnerGymTheme } from "./api";
import { formatGymOptionLabel } from "./utils/gymLabel";
import { buildMainAppUrl } from "./utils/subdomain";
import { usePlanFeatures } from "./planFeaturesContext";
import type { SaasPlanFeatureId } from "./saasPlanFeatures";
import {
  getEmployeeSupportUnreadCount,
  getOwnerSupportUnreadCount,
  SUPPORT_INBOX_UPDATED_EVENT,
} from "./supportApi";

type NavItem = {
  label: string;
  to: string;
  icon: ReactElement;
  feature?: SaasPlanFeatureId;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const OWNER_NAV_STORAGE_KEY = "gymlos-owner-nav-collapsed";

function filterOwnerItems(items: NavItem[], hasFeature: (feature: SaasPlanFeatureId) => boolean) {
  return items.filter((item) => !item.feature || hasFeature(item.feature));
}

function ownerNavGroups(hasFeature: (feature: SaasPlanFeatureId) => boolean): NavGroup[] {
  const groups: NavGroup[] = [
    {
      id: "daily",
      label: "Codziennie",
      items: [
        { label: "Podsumowanie", to: "/owner/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Klienci", to: "/owner/guests", icon: <Users className="w-5 h-5" /> },
        { label: "Karnety", to: "/owner/passes", icon: <Ticket className="w-5 h-5" /> },
        { label: "Obsługa klienta", to: "/owner/support", icon: <Inbox className="w-5 h-5" /> },
      ],
    },
    {
      id: "facility",
      label: "Operacje",
      items: [
        { label: "Szafki", to: "/owner/lockers", icon: <Lock className="w-5 h-5" />, feature: "LOCKERS" },
        { label: "Terminarz", to: "/owner/schedule", icon: <CalendarDays className="w-5 h-5" />, feature: "SCHEDULE" },
        { label: "Grafik", to: "/owner/work-schedule", icon: <CalendarClock className="w-5 h-5" />, feature: "WORK_SCHEDULE" },
        { label: "Oceny zajęć", to: "/owner/class-ratings", icon: <Star className="w-5 h-5" />, feature: "CLASS_RATINGS" },
      ],
    },
    {
      id: "team",
      label: "Zespół i oferta",
      items: [
        { label: "Siłownie", to: "/owner/gyms", icon: <Store className="w-5 h-5" /> },
        { label: "Pracownicy", to: "/owner/employees", icon: <BadgeCheck className="w-5 h-5" /> },
        { label: "Trenerzy", to: "/owner/trainers", icon: <UserCircle className="w-5 h-5" />, feature: "TRAINER_BOOKINGS" },
        { label: "Rangi", to: "/owner/ranks", icon: <Award className="w-5 h-5" /> },
        { label: "Oferta", to: "/owner/pass-types", icon: <ListPlus className="w-5 h-5" /> },
      ],
    },
    {
      id: "finance",
      label: "Finanse",
      items: [
        { label: "Wypłaty", to: "/owner/payouts", icon: <Banknote className="w-5 h-5" /> },
        { label: "Magazyn", to: "/owner/products", icon: <Package className="w-5 h-5" />, feature: "INVENTORY" },
        { label: "Raport sprzedaży", to: "/owner/sales-report", icon: <Wallet className="w-5 h-5" />, feature: "SALES_REPORT" },
        { label: "Analityka", to: "/owner/analytics", icon: <LineChart className="w-5 h-5" />, feature: "ANALYTICS" },
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      items: [
        { label: "Marketing i CRM", to: "/owner/crm", icon: <Megaphone className="w-5 h-5" />, feature: "CRM" },
        { label: "Powiadomienia", to: "/owner/notifications", icon: <Bell className="w-5 h-5" />, feature: "NOTIFICATIONS" },
      ],
    },
    {
      id: "admin",
      label: "Administracja",
      items: [
        { label: "Historia", to: "/owner/history", icon: <History className="w-5 h-5" />, feature: "AUDIT_LOG" },
        { label: "Ustawienia", to: "/owner/settings", icon: <Settings className="w-5 h-5" /> },
      ],
    },
  ];

  return groups
    .map((group) => ({ ...group, items: filterOwnerItems(group.items, hasFeature) }))
    .filter((group) => group.items.length > 0);
}

function employeeNavGroups(employeePermissions: EmployeePermission[]): NavGroup[] {
  const canAccess = (to: string) => {
    if (to === "/employee/lockers") {
      return (
        hasEmployeePermission(employeePermissions, "MANAGE_LOCKERS") ||
        hasEmployeePermission(employeePermissions, "CREATE_LOCKERS")
      );
    }
    return canAccessEmployeeRoute(to, employeePermissions);
  };

  const filterItems = (items: NavItem[]) => items.filter((item) => canAccess(item.to));

  const groups: NavGroup[] = [
    {
      id: "frontdesk",
      label: "Recepcja",
      items: [
        { label: "Dashboard", to: "/employee/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Klienci", to: "/employee/guests", icon: <Users className="w-5 h-5" /> },
        { label: "Obecni", to: "/employee/present", icon: <MapPin className="w-5 h-5" /> },
        { label: "Skaner QR", to: "/employee/qr-scanner", icon: <QrCode className="w-5 h-5" /> },
        { label: "Kasa (POS)", to: "/employee/pos", icon: <ShoppingCart className="w-5 h-5" /> },
        { label: "Kluczyki", to: "/employee/lockers", icon: <KeyRound className="w-5 h-5" /> },
      ],
    },
    {
      id: "classes",
      label: "Zajęcia",
      items: [
        { label: "Zajęcia", to: "/employee/classes", icon: <CalendarDays className="w-5 h-5" /> },
        { label: "Terminarz", to: "/employee/schedule", icon: <CalendarDays className="w-5 h-5" /> },
        { label: "Grafik", to: "/employee/work-schedule", icon: <CalendarClock className="w-5 h-5" /> },
      ],
    },
    {
      id: "more",
      label: "Więcej",
      items: [
        { label: "Oferta", to: "/employee/pass-types", icon: <ListPlus className="w-5 h-5" /> },
        { label: "Profil Trenera", to: "/employee/trainer-profile", icon: <UserCircle className="w-5 h-5" /> },
        { label: "Obsługa klienta", to: "/employee/support", icon: <Inbox className="w-5 h-5" /> },
      ],
    },
  ];

  return groups.map((group) => ({ ...group, items: filterItems(group.items) })).filter((group) => group.items.length > 0);
}

function readCollapsedOwnerGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(OWNER_NAV_STORAGE_KEY);
    if (!raw) return new Set(["facility", "team", "finance", "marketing", "admin"]);
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set(["facility", "team", "finance", "marketing", "admin"]);
  }
}

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.items.some((item) => pathname === item.to || pathname.startsWith(item.to + "/"));
}

export function AppShell() {
  const { auth, logout, isImpersonating, endImpersonation } = useAuth();
  const navigate = useNavigate();
  const { permissions: employeePermissions } = useEmployeePermissions();
  const { brandName, setBrandName } = useSelectedGymBrand();
  const { state: gymSelector, setSelectorState } = useAppGymSelector();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const displayName = brandName.trim();
  const { hasFeature } = usePlanFeatures();
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [collapsedOwnerGroups, setCollapsedOwnerGroups] = useState<Set<string>>(() => readCollapsedOwnerGroups());
  const [collapsedEmployeeGroups, setCollapsedEmployeeGroups] = useState<Set<string>>(
    () => new Set(["classes", "more"])
  );

  const currentGym = gymSelector.gyms.find((g) => g.id === gymSelector.selectedGymId);
  const themeColor = currentGym?.themeColor || "#2155e5";
  const [localThemeColor, setLocalThemeColor] = useState(themeColor);

  useEffect(() => {
    setLocalThemeColor(currentGym?.themeColor || "#2155e5");
  }, [currentGym?.themeColor]);

  useEffect(() => {
    const vars = generateThemeVars(localThemeColor);
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [localThemeColor]);

  const handleThemeSave = async (color: string) => {
    if (!currentGym || auth?.role !== 'OWNER') return;
    try {
      await updateOwnerGymTheme(auth, currentGym.id, { themeColor: color });
      setSelectorState({
        gyms: gymSelector.gyms.map(g => g.id === currentGym.id ? { ...g, themeColor: color } : g)
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleSubscriptionError() {
      setSubscriptionExpired(true);
    }
    window.addEventListener("subscription_required", handleSubscriptionError);
    return () => window.removeEventListener("subscription_required", handleSubscriptionError);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/superadmin")) {
      setSubscriptionExpired(false);
    }
  }, [location.pathname, gymSelector.selectedGymId]);

  const canViewSupportInbox =
    auth?.role === "OWNER" ||
    (auth?.role === "EMPLOYEE" && hasEmployeePermission(employeePermissions, "MANAGE_SUPPORT"));

  useEffect(() => {
    if (!auth || !canViewSupportInbox || gymSelector.selectedGymId === "") {
      setSupportUnreadCount(0);
      return;
    }

    const gymId = Number(gymSelector.selectedGymId);
    if (Number.isNaN(gymId)) {
      setSupportUnreadCount(0);
      return;
    }

    const currentAuth = auth;
    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const count =
          currentAuth.role === "OWNER"
            ? await getOwnerSupportUnreadCount(currentAuth, gymId)
            : await getEmployeeSupportUnreadCount(currentAuth, gymId);
        if (!cancelled) setSupportUnreadCount(count);
      } catch {
        if (!cancelled) setSupportUnreadCount(0);
      }
    }

    loadUnreadCount();
    const interval = window.setInterval(loadUnreadCount, 60_000);

    function handleSupportInboxUpdated() {
      loadUnreadCount();
    }
    window.addEventListener(SUPPORT_INBOX_UPDATED_EVENT, handleSupportInboxUpdated);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener(SUPPORT_INBOX_UPDATED_EVENT, handleSupportInboxUpdated);
    };
  }, [auth, canViewSupportInbox, gymSelector.selectedGymId, location.pathname]);

  useEffect(() => {
    if (displayName) {
      document.title = displayName;
    } else {
      document.title = "Gymlos";
    }
  }, [displayName]);

  const employeeNavGroupsResolved = useMemo(
    () => employeeNavGroups(employeePermissions),
    [employeePermissions]
  );

  const clientNavItems = useMemo(
    () => [
      { label: "Pulpit", to: "/client/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: "Zajęcia i Treningi", to: "/client/activities", icon: <CalendarDays className="w-5 h-5" /> },
      { label: "Wiadomości", to: "/client/messages", icon: <Inbox className="w-5 h-5" /> },
      { label: "Dołącz do siłowni", to: "/client/gyms/join", icon: <Store className="w-5 h-5" /> },
    ],
    []
  );

  const superAdminNavItems = useMemo(
    () => [
      { label: "Subskrypcje", to: "/superadmin/subscriptions", icon: <CreditCard className="w-5 h-5" /> },
      { label: "Plany", to: "/superadmin/plans", icon: <Layers className="w-5 h-5" /> },
      { label: "Użytkownicy", to: "/superadmin/users", icon: <Users className="w-5 h-5" /> },
      { label: "Zarządzanie", to: "/superadmin/management", icon: <Settings className="w-5 h-5" /> },
    ],
    []
  );

  const ownerNavGroupsResolved = useMemo(() => ownerNavGroups(hasFeature), [hasFeature]);

  useEffect(() => {
    if (auth?.role === "OWNER") {
      const activeGroup = ownerNavGroupsResolved.find((group) => groupContainsPath(group, location.pathname));
      if (activeGroup) {
        setCollapsedOwnerGroups((prev) => {
          if (!prev.has(activeGroup.id)) return prev;
          const next = new Set(prev);
          next.delete(activeGroup.id);
          localStorage.setItem(OWNER_NAV_STORAGE_KEY, JSON.stringify([...next]));
          return next;
        });
      }
    }
    if (auth?.role === "EMPLOYEE") {
      const activeGroup = employeeNavGroupsResolved.find((group) => groupContainsPath(group, location.pathname));
      if (activeGroup) {
        setCollapsedEmployeeGroups((prev) => {
          if (!prev.has(activeGroup.id)) return prev;
          const next = new Set(prev);
          next.delete(activeGroup.id);
          return next;
        });
      }
    }
  }, [auth?.role, location.pathname, ownerNavGroupsResolved, employeeNavGroupsResolved]);

  function toggleOwnerGroup(groupId: string) {
    setCollapsedOwnerGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      localStorage.setItem(OWNER_NAV_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleEmployeeGroup(groupId: string) {
    setCollapsedEmployeeGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function renderNavLink(item: NavItem) {
    const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
    const isSupportNav = item.to === "/owner/support" || item.to === "/employee/support";
    const showSupportBubble = isSupportNav && supportUnreadCount > 0;

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setDrawerOpen(false)}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl font-display font-semibold transition-colors ${focusRingClassName}
          ${
            isActive
              ? "bg-primary-500/10 dark:bg-primary-950/25 text-primary-700 dark:text-primary-400 ring-1 ring-primary-500/20 dark:ring-primary-500/30"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/40 dark:hover:bg-slate-900/30 hover:text-slate-950 dark:hover:text-slate-100"
          }
        `}
      >
        <div className={`relative shrink-0 ${isActive ? "text-primary-500 dark:text-primary-400" : "text-slate-500 dark:text-slate-500"}`}>
          {item.icon}
          {showSupportBubble && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none ring-2 ring-white dark:ring-slate-950">
              {supportUnreadCount > 9 ? "9+" : supportUnreadCount}
            </span>
          )}
        </div>
        <span className="text-sm flex-1 min-w-0">{item.label}</span>
        {showSupportBubble && (
          <span
            className="shrink-0 max-w-[9rem] text-[10px] font-semibold leading-tight text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-lg"
            title={`${supportUnreadCount} nieodczytanych wiadomości od klientów`}
          >
            {supportUnreadCount === 1
              ? "1 nowa"
              : supportUnreadCount < 5
              ? `${supportUnreadCount} nowe`
              : `${supportUnreadCount} nieodczyt.`}
          </span>
        )}
      </Link>
    );
  }

  function renderNavGroups(groups: NavGroup[], collapsed: Set<string>, onToggle: (id: string) => void) {
    return groups.map((group, index) => (
      <div key={group.id} className={index > 0 ? "mt-5 pt-5 border-t border-slate-200/50 dark:border-slate-800/40" : ""}>
        <button
          type="button"
          onClick={() => onToggle(group.id)}
          aria-expanded={!collapsed.has(group.id)}
          className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 mb-1 rounded-lg text-left text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors ${focusRingClassName}`}
        >
          <span>{group.label}</span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${collapsed.has(group.id) ? "-rotate-90" : ""}`}
            aria-hidden="true"
          />
        </button>
        {!collapsed.has(group.id) && <div className="space-y-0.5">{group.items.map(renderNavLink)}</div>}
      </div>
    ));
  }

  function renderSidebarNav() {
    if (auth?.role === "OWNER") {
      return renderNavGroups(ownerNavGroupsResolved, collapsedOwnerGroups, toggleOwnerGroup);
    }
    if (auth?.role === "EMPLOYEE") {
      return renderNavGroups(employeeNavGroupsResolved, collapsedEmployeeGroups, toggleEmployeeGroup);
    }
    const flatItems =
      auth?.role === "SUPER_ADMIN" ? superAdminNavItems : auth?.role === "GUEST" ? clientNavItems : [];
    return <div className="space-y-0.5">{flatItems.map(renderNavLink)}</div>;
  }

  function handleEndImpersonation() {
    if (endImpersonation()) {
      window.location.href = buildMainAppUrl("/superadmin/users");
    }
  }

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
            {formatGymOptionLabel(g)}
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
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white/95 dark:bg-slate-950/95 lg:bg-white/90 lg:dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-800/40 transition-transform duration-300 ease-out
          ${drawerOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-200/40 dark:border-slate-800/30 gap-4 min-w-0">
          <GymLosLogo className="h-10 w-auto text-primary-500 shrink-0" />
          {displayName ? (
            <span
              className="font-display font-semibold text-sm text-slate-600 dark:text-slate-400 tracking-tight truncate min-w-0 flex-1 border-l border-slate-200 dark:border-slate-700 pl-4"
              title={displayName}
            >
              {displayName}
            </span>
          ) : null}
          <button
            type="button"
            aria-label="Zamknij menu"
            className={`ml-auto lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/30 transition-colors ${focusRingClassName}`}
            onClick={() => setDrawerOpen(false)}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {gymSelectControl && (
          <div className="px-5 py-4 border-b border-slate-200/40 dark:border-slate-800/30 bg-slate-50/30 dark:bg-slate-950/10">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
              Wybrana siłownia
            </label>
            {gymSelectControl}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-slate-250 dark:scrollbar-thumb-slate-800">
          {renderSidebarNav()}
        </nav>

        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/30 bg-slate-50/20 dark:bg-slate-950/10 space-y-2">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer ${focusRingClassName}`}
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Tryb ciemny</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                <span>Tryb jasny</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center justify-center gap-3 w-full px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group cursor-pointer ${focusRingClassName}`}
          >
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" aria-hidden="true" />
            Wyloguj się
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {isImpersonating && (
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 z-40">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Podgląd konta: <span className="font-bold">{auth?.email}</span> ({auth?.role})
            </p>
            <button
              type="button"
              onClick={handleEndImpersonation}
              className={`shrink-0 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold ${focusRingClassName}`}
            >
              Zakończ podgląd
            </button>
          </div>
        )}
        <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/40 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-30 transition-colors">
          {/* Left side: Mobile menu toggle and title */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Otwórz menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className={`lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors ${focusRingClassName}`}
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <div className="lg:hidden flex items-center gap-2 font-display font-bold text-slate-900 dark:text-slate-100 min-w-0">
              <Dumbbell className="w-5 h-5 text-primary-500 shrink-0" aria-hidden="true" />
              {displayName ? (
                <span className="truncate text-sm tracking-tight" title={displayName}>
                  {displayName}
                </span>
              ) : null}
            </div>
          </div>

          {/* Right side: Gym selector (mobile), User Profile Bar */}
          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            {gymSelector.gyms.length > 0 ? (
              <div className="lg:hidden">
                <select
                  value={gymSelector.selectedGymId === "" ? "" : String(gymSelector.selectedGymId)}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (!Number.isNaN(id)) gymSelector.onSelectGym(id);
                  }}
                  className="max-w-[140px] text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary-500/20"
                  aria-label="Wybierz siłownię"
                >
                  {gymSelector.gyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {formatGymOptionLabel(g)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* User Profile Section */}
            <div className="relative pl-4 sm:pl-6 border-l border-slate-200 dark:border-slate-800" ref={profileMenuRef}>
              <button
                type="button"
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`flex items-center gap-3 hover:opacity-90 transition-opacity group cursor-pointer rounded-lg ${focusRingClassName}`}
              >
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {auth?.email?.split('@')[0] || "Użytkownik"}
                  </span>
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {auth?.role === "OWNER" ? "Właściciel" : auth?.role === "EMPLOYEE" ? "Pracownik" : "Klient"}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 ring-2 ring-white dark:ring-slate-900">
                  <UserCircle className="w-6 h-6" aria-hidden="true" />
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50" role="menu">
                  <Link
                    to={`/${auth?.role?.toLowerCase() || 'client'}/profile`}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Ustawienia
                  </Link>
                  {auth?.role === 'OWNER' && (
                    <Link
                      to="/owner/subscription"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      Subskrypcja
                    </Link>
                  )}
                  {auth?.role === 'OWNER' && currentGym && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Kolor siłowni</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {PRESET_THEMES.map((pt) => (
                          <button
                            key={pt.hex}
                            type="button"
                            className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                            style={{ 
                              backgroundColor: pt.hex,
                              borderColor: localThemeColor === pt.hex ? '#ffffff' : 'transparent',
                              boxShadow: localThemeColor === pt.hex ? `0 0 0 2px ${pt.hex}` : 'none'
                            }}
                            onClick={() => {
                              setLocalThemeColor(pt.hex);
                              handleThemeSave(pt.hex);
                            }}
                            title={pt.label}
                          />
                        ))}
                        <div 
                          className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-transparent hover:scale-110 transition-transform flex-shrink-0 cursor-pointer" 
                          style={{
                            background: 'conic-gradient(red, yellow, green, cyan, blue, magenta, red)',
                            boxShadow: !PRESET_THEMES.find(p => p.hex === localThemeColor) ? `0 0 0 2px ${localThemeColor}` : 'none'
                          }}
                          title="Wybierz własny kolor"
                        >
                          <input
                            type="color"
                            className="absolute inset-[-10px] w-12 h-12 opacity-0 cursor-pointer"
                            value={localThemeColor}
                            onChange={(e) => setLocalThemeColor(e.target.value)}
                            onBlur={(e) => handleThemeSave(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {subscriptionExpired && location.pathname !== "/owner/subscription" ? (
              <SubscriptionExpiredView 
                role={auth?.role} 
                onNavigateToSubscription={() => {
                  setSubscriptionExpired(false);
                  navigate("/owner/subscription");
                }} 
              />
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
