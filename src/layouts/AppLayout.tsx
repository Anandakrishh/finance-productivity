import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, Target, Flame, BarChart3, CalendarDays,
  Wallet, Receipt, PiggyBank, TrendingUp, Settings, Menu, Home,
  X, Clock3, ChevronRight, CreditCard, Zap, Plus,
} from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { getLocalDateString } from "../components/AppUI";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useAppData();

  const activeSection = useMemo<"home" | "productivity" | "finance" | "settings">(() => {
    const p = location.pathname;
    if (p === "/") return "home";
    if (p.startsWith("/productivity") || p === "/tasks" || p === "/habits" || p === "/goals" || p === "/calendar" || p === "/progress") {
      return "productivity";
    }
    if (p === "/settings") return "settings";
    return "finance";
  }, [location.pathname]);

  const today = getLocalDateString();
  const dailyTasks = data.tasks.filter(t => t.date === today);
  const dailyDone = dailyTasks.filter(t => t.completed).length;
  const dailyProgress = dailyTasks.length ? Math.round((dailyDone / dailyTasks.length) * 100) : 0;

  const displayName = useMemo(() => {
    try {
      const s = JSON.parse(localStorage.getItem("pulse-settings") || "{}");
      return s.name || "Anand";
    } catch {
      return "Anand";
    }
  }, [location.pathname]);

  const avatarInitials = useMemo(() => {
    if (!displayName) return "AK";
    if (displayName.toLowerCase() === "anand" || displayName.toLowerCase().includes("anand")) return "AK";
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });

  const go = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090807] text-white pulse-app-root transition-colors duration-200">
      {/* Background ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden ambient-glow-container">
        <div className="absolute -top-32 right-[-5%] h-[550px] w-[550px] rounded-full bg-orange-500/[0.12] blur-[125px]" />
        <div className="absolute top-[35%] -left-32 h-[500px] w-[500px] rounded-full bg-amber-600/[0.10] blur-[135px]" />
        <div className="absolute -bottom-24 right-[20%] h-[450px] w-[450px] rounded-full bg-orange-600/[0.08] blur-[145px]" />
      </div>

      {/* Floating iOS / macOS Frosted Glass Sidebar Card (Image 2 Replica) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Soft backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/65 sm:backdrop-blur-sm touch-manipulation cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Floating Glassy Island Card - Pure GPU transform slide */}
            <motion.aside
              initial={{ x: "-110%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-110%", opacity: 0.9 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "transform", transform: "translateZ(0)" }}
              className="fixed left-3 sm:left-6 top-3 sm:top-6 bottom-3 sm:bottom-6 z-50 flex w-[320px] sm:w-[335px] max-w-[calc(100vw-24px)] flex-col rounded-[30px] sm:rounded-[34px] border border-white/[0.18] bg-stone-900/90 sm:bg-stone-900/85 p-3.5 sm:p-4 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.25)] overflow-hidden touch-manipulation"
            >
              {/* 1. macOS Window Traffic Lights & Close */}
              <div className="flex items-center justify-between px-1.5 pt-1 pb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    onClick={() => setSidebarOpen(false)}
                    className="h-3 w-3 rounded-full bg-[#ff5f56] shadow-sm hover:opacity-80 transition cursor-pointer"
                    title="Close"
                  />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-sm" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f] shadow-sm" />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] hover:text-white transition"
                  title="Close navigation"
                >
                  <X size={14} />
                </button>
              </div>

              {/* 2. User Profile Greeting Header */}
              <div className="flex items-center gap-3 px-1.5 py-2.5">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-300 text-zinc-950 font-black shadow-md shadow-orange-500/20">
                  <span className="text-sm font-black tracking-tight">{avatarInitials}</span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-stone-900 bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-zinc-400">Good day 👋</p>
                  <p className="truncate text-sm font-bold tracking-tight text-white">{displayName}</p>
                </div>
              </div>

              {/* 3. Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2 scrollbar-none">
                {/* Core Navigation Group */}
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Menu</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">3</span>
                  </div>
                  <div className="space-y-1">
                    <NavItem
                      label="Home Dashboard"
                      icon={LayoutDashboard}
                      active={location.pathname === "/"}
                      onClick={() => go("/")}
                    />
                    <NavItem
                      label="Productivity Hub"
                      icon={Zap}
                      active={location.pathname === "/productivity"}
                      onClick={() => go("/productivity")}
                    />
                    <NavItem
                      label="Finance Cockpit"
                      icon={Wallet}
                      active={location.pathname === "/finance"}
                      onClick={() => go("/finance")}
                    />
                  </div>
                </div>

                {/* Productivity Group - Nested Frosted Glass Card (Matching "Service: 3" in Image 2) */}
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Productivity</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">5</span>
                  </div>
                  <div className="rounded-[22px] border border-white/[0.12] bg-white/[0.04] p-1.5 space-y-0.5 shadow-inner">
                    <SubNavItem
                      label="Tasks"
                      icon={CheckSquare}
                      active={location.pathname === "/tasks"}
                      onClick={() => go("/tasks")}
                      badge={data.tasks.filter(t => !t.completed).length || undefined}
                    />
                    <SubNavItem
                      label="Habits"
                      icon={Flame}
                      active={location.pathname === "/habits"}
                      onClick={() => go("/habits")}
                      badge={data.habits.length || undefined}
                    />
                    <SubNavItem
                      label="Goals"
                      icon={Target}
                      active={location.pathname === "/goals"}
                      onClick={() => go("/goals")}
                    />
                    <SubNavItem
                      label="Progress"
                      icon={BarChart3}
                      active={location.pathname === "/progress"}
                      onClick={() => go("/progress")}
                    />
                    <SubNavItem
                      label="Calendar"
                      icon={CalendarDays}
                      active={location.pathname === "/calendar"}
                      onClick={() => go("/calendar")}
                    />
                  </div>
                </div>

                {/* Finance & Wealth Group - Nested Frosted Glass Card */}
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Finance & Wealth</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">5</span>
                  </div>
                  <div className="rounded-[22px] border border-white/[0.12] bg-white/[0.04] p-1.5 space-y-0.5 shadow-inner">
                    <SubNavItem
                      label="Spending Calendar"
                      icon={CalendarDays}
                      active={location.pathname === "/finance-calendar"}
                      onClick={() => go("/finance-calendar")}
                    />
                    <SubNavItem
                      label="Transactions"
                      icon={Receipt}
                      active={location.pathname === "/transactions"}
                      onClick={() => go("/transactions")}
                      badge={data.transactions.length || undefined}
                    />
                    <SubNavItem
                      label="EMIs & Loans"
                      icon={CreditCard}
                      active={location.pathname === "/emi"}
                      onClick={() => go("/emi")}
                    />
                    <SubNavItem
                      label="Budget"
                      icon={PiggyBank}
                      active={location.pathname === "/budget"}
                      onClick={() => go("/budget")}
                    />
                    <SubNavItem
                      label="Investments"
                      icon={TrendingUp}
                      active={location.pathname === "/investments"}
                      onClick={() => go("/investments")}
                    />
                  </div>
                </div>

                {/* Quick Action Card (Matching "Create new task" in Image 2) */}
                <div className="rounded-[22px] border border-white/[0.14] bg-white/[0.05] p-3 text-center shadow-sm">
                  <button
                    onClick={() => { go("/tasks"); }}
                    className="group mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all touch-manipulation"
                    title="Create new task"
                  >
                    <Plus size={20} className="transition-transform group-hover:rotate-90 duration-300" />
                  </button>
                  <p className="text-xs font-semibold text-white">Create new task</p>
                  <button
                    onClick={() => { go("/transactions"); }}
                    className="mt-0.5 text-[10px] text-zinc-400 hover:text-orange-300 transition touch-manipulation"
                  >
                    Or record transaction →
                  </button>
                </div>
              </div>

              {/* 4. Bottom Toolbar (Settings & Task Progress Status) */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-2 px-1">
                <button
                  onClick={() => go("/settings")}
                  className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    location.pathname === "/settings"
                      ? "bg-white text-zinc-950 font-semibold shadow-sm"
                      : "text-zinc-400 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <Settings size={15} />
                  <span>Settings</span>
                </button>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-zinc-400">
                  {dailyDone}/{dailyTasks.length} tasks ({dailyProgress}%)
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Sticky top header with ONLY the brand logo and date */}
        <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-white/[0.08] bg-[#0c0a09]/40 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
          {/* Left: Brand Logo only */}
          <div className="flex items-center gap-3">
            <button onClick={() => go("/")} className="flex items-center gap-2.5 text-left transition hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-black shadow-md shadow-white/10">
                <span className="text-xs font-black tracking-tighter text-black select-none">AK</span>
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white">FINANCE</span>
              </div>
            </button>
          </div>

          {/* Right: Clean date pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 sm:px-3.5 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur-xl shadow-sm hover:bg-white/[0.09] transition-all">
              <Clock3 size={13} className="text-orange-400" />
              <span>{dateLabel}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-28 sm:pb-32">
          <Outlet />
        </main>

        {/* Floating Bottom Dock (iOS Liquid Glass Style) */}
        <nav
          aria-label="Bottom Navigation Dock"
          className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto touch-manipulation select-none"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/[0.16] bg-white/[0.08] p-1.5 sm:p-2 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {/* 1. Home */}
            {activeSection === "home" && !sidebarOpen ? (
              <button
                onClick={() => go("/")}
                className="flex items-center gap-2 rounded-full bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-150 touch-manipulation"
                title="Home Dashboard"
              >
                <Home size={16} className="text-zinc-950 shrink-0" />
                <span className="tracking-tight">Home</span>
              </button>
            ) : (
              <button
                onClick={() => go("/")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all duration-150 touch-manipulation"
                title="Home Dashboard"
              >
                <Home size={18} />
              </button>
            )}

            {/* 2. Productivity */}
            {activeSection === "productivity" && !sidebarOpen ? (
              <button
                onClick={() => go("/productivity")}
                className="flex items-center gap-2 rounded-full bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-150 touch-manipulation"
                title="Productivity Hub"
              >
                <Zap size={16} className="text-zinc-950 shrink-0" />
                <span className="tracking-tight">Productivity</span>
              </button>
            ) : (
              <button
                onClick={() => go("/productivity")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all duration-150 touch-manipulation"
                title="Productivity Hub"
              >
                <Zap size={18} />
              </button>
            )}

            {/* 3. Finance */}
            {activeSection === "finance" && !sidebarOpen ? (
              <button
                onClick={() => go("/finance")}
                className="flex items-center gap-2 rounded-full bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-150 touch-manipulation"
                title="Finance Cockpit"
              >
                <Wallet size={16} className="text-zinc-950 shrink-0" />
                <span className="tracking-tight">Finance</span>
              </button>
            ) : (
              <button
                onClick={() => go("/finance")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all duration-150 touch-manipulation"
                title="Finance Cockpit"
              >
                <Wallet size={18} />
              </button>
            )}

            {/* 4. Menu (three lines option - placed after finance) */}
            {sidebarOpen ? (
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 rounded-full bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-150 touch-manipulation"
                title="Close Navigation"
              >
                <X size={16} className="text-zinc-950 shrink-0" />
                <span className="tracking-tight">Menu</span>
              </button>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all duration-150 touch-manipulation"
                title="All Pages Menu"
              >
                <Menu size={18} />
              </button>
            )}

            {/* 5. Settings */}
            {activeSection === "settings" && !sidebarOpen ? (
              <button
                onClick={() => go("/settings")}
                className="flex items-center gap-2 rounded-full bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-150 touch-manipulation"
                title="Settings & Profile"
              >
                <Settings size={16} className="text-zinc-950 shrink-0" />
                <span className="tracking-tight">Settings</span>
              </button>
            ) : (
              <button
                onClick={() => go("/settings")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all duration-150 touch-manipulation"
                title="Settings & Profile"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  path?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-xs font-medium transition-all duration-200 ${
        active
          ? "bg-white text-zinc-950 font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
          : "text-zinc-300 hover:bg-white/[0.08] hover:text-white active:scale-95"
      }`}
    >
      <Icon size={16} className={active ? "text-zinc-950 shrink-0" : "text-zinc-400 shrink-0"} />
      <span className="truncate">{label}</span>
      {active && <ChevronRight size={14} className="ml-auto text-zinc-950 shrink-0" />}
    </button>
  );
}

function SubNavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: typeof Settings;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[14px] px-3 py-2 text-xs font-medium transition-all duration-200 ${
        active
          ? "bg-white text-zinc-950 font-semibold shadow-sm"
          : "text-zinc-300 hover:bg-white/[0.08] hover:text-white active:scale-95"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={15} className={active ? "text-zinc-950 shrink-0" : "text-zinc-400 shrink-0"} />
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            active
              ? "bg-zinc-900 text-white"
              : "bg-white/[0.08] text-zinc-400"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default AppLayout;

