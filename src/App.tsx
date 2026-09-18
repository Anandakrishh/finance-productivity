import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppDataProvider } from "./context/AppDataContext";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Productivity from "./pages/Productivity";
import Progress from "./pages/Progress";
import Finance from "./pages/Finance";
import FinanceCalendar from "./pages/FinanceCalendar";
import EMI from "./pages/EMI";
import Transactions from "./pages/Transactions";
import Budget from "./pages/Budget";
import Investments from "./pages/Investments";
import NetWorth from "./pages/NetWorth";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";

const SETTINGS_KEY = "pulse-settings";

function ThemeInitializer() {
  useEffect(() => {
    const apply = () => {
      try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"appearance":"dark"}');
        const appearance = settings.appearance || "dark";
        const theme = appearance === "system"
          ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : appearance;
        const root = document.documentElement;
        root.classList.toggle("pulse-dark", theme === "dark");
        root.classList.toggle("pulse-light", theme === "light");
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
      } catch {
        document.documentElement.classList.add("pulse-dark");
      }
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener?.("change", apply);
    window.addEventListener("storage", apply);
    return () => {
      media.removeEventListener?.("change", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);
  return null;
}

function ProtectedApp() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#060709] text-sm text-zinc-500">Loading PULSE…</div>;
  if (!user) return <Auth />;

  return (
    <AppDataProvider userId={user.id}>
      <ThemeInitializer />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productivity" element={<Productivity />} />
          <Route path="/tasks" element={<Navigate to="/productivity?tab=tasks" replace />} />
          <Route path="/goals" element={<Navigate to="/productivity?tab=goals" replace />} />
          <Route path="/habits" element={<Navigate to="/productivity?tab=habits" replace />} />
          <Route path="/calendar" element={<Navigate to="/productivity?tab=calendar" replace />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance-calendar" element={<FinanceCalendar />} />
          <Route path="/emi" element={<EMI />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/net-worth" element={<NetWorth />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppDataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
