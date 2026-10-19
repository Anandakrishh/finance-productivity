import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { X, Calendar, ChevronDown, Home, Zap, Wallet } from "lucide-react";

export const pageClass = "mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8";

export function getLocalDateString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LiquidCard({ children, className = "", hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      className={`liquid-card ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", type = "button", className = "", disabled = false }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; type?: "button" | "submit"; className?: string; disabled?: boolean;
}) {
  const styles = variant === "primary"
    ? "bg-white text-black hover:bg-zinc-200"
    : variant === "danger"
      ? "bg-red-500/10 text-red-300 border border-red-400/10 hover:bg-red-500/15"
      : "border border-white/[0.08] bg-white/[0.035] text-zinc-300 hover:bg-white/[0.07] hover:text-white";
  return <button disabled={disabled} type={type} onClick={onClick} className={`rounded-xl px-4 py-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}>{children}</button>;
}

export function IconButton({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label: string }) {
  return <button aria-label={label} title={label} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-zinc-500 transition hover:bg-white/[0.07] hover:text-white">{children}</button>;
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <motion.div initial={{ opacity: 0, scale: .97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="liquid-card w-full max-w-lg p-5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}><X size={16} /></IconButton>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</span>{children}</label>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`liquid-input ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`liquid-input ${props.className ?? ""}`} />;
}

export function Metric({ icon, label, value, detail, trend }: { icon: ReactNode; label: string; value: string; detail?: string; trend?: "up" | "down" }) {
  return (
    <LiquidCard className="p-4 sm:p-5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400">{icon}</div>
      <p className="text-[11px] text-zinc-500">{label}</p>
      <div className="mt-1 flex items-end gap-2"><p className="text-xl font-semibold tracking-tight">{value}</p>{trend && <span className={`mb-1 text-[10px] ${trend === "up" ? "text-emerald-300" : "text-red-300"}`}>{trend === "up" ? "↗" : "↘"}</span>}</div>
      {detail && <p className="mt-1 text-[10px] text-zinc-600">{detail}</p>}
    </LiquidCard>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return <div className={`h-1.5 overflow-hidden rounded-full bg-white/[0.055] ${className}`}><div className="h-full rounded-full bg-gradient-to-r from-[#2563FF] to-[#22B8FF] transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.045] text-zinc-500">{icon}</div><p className="text-sm font-medium">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-zinc-600">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function getInitialPrivacyMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("pulse-settings");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.privacy);
  } catch {
    return false;
  }
}

let _globalPrivacyMode = getInitialPrivacyMode();

export function setGlobalPrivacyMode(enabled: boolean) {
  _globalPrivacyMode = enabled;
}

export function getGlobalPrivacyMode(): boolean {
  return _globalPrivacyMode;
}

export function formatMoney(value: number, currency = "₹", privacyOverride?: boolean) {
  const isPrivate = privacyOverride !== undefined ? privacyOverride : _globalPrivacyMode;
  if (isPrivate) {
    return `${currency} ••••••`;
  }
  return `${currency}${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatPercent(value: number | string, privacyOverride?: boolean) {
  const isPrivate = privacyOverride !== undefined ? privacyOverride : _globalPrivacyMode;
  if (isPrivate) {
    return "••%";
  }
  return typeof value === "number" ? `${value}%` : `${value}`;
}

export function formatDate(value: string) {
  if (!value) return "—";
  return new Date(`${value.slice(0,10)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function parseTransactionDate(dateStr?: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  }
  return null;
}

export function getAvailableMonths(transactions: { date: string }[]) {
  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const set = new Set<string>();
  set.add(currentYm);
  for (const t of transactions) {
    const parsed = parseTransactionDate(t.date);
    if (parsed) {
      set.add(`${parsed.year}-${String(parsed.month).padStart(2, "0")}`);
    }
  }
  const sorted = Array.from(set).sort((a, b) => b.localeCompare(a));
  return sorted.map(ym => {
    const [year, month] = ym.split("-");
    const d = new Date(Number(year), Number(month) - 1, 15);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { value: ym, label };
  });
}

export function MonthSelect({
  value,
  onChange,
  transactions = [],
  className = "",
  allLabel = "All Months"
}: {
  value: string;
  onChange: (val: string) => void;
  transactions?: { date: string }[];
  className?: string;
  allLabel?: string;
}) {
  const months = getAvailableMonths(transactions);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Calendar size={13} className="pointer-events-none absolute left-3 text-zinc-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-xl border border-white/[0.08] bg-white/[0.035] pl-8 pr-8 text-xs font-medium text-zinc-200 outline-none transition hover:border-white/[0.15] hover:bg-white/[0.06] focus:border-white/25 focus:ring-1 focus:ring-white/20"
      >
        <option value="all" className="bg-[#111317] text-white">{allLabel}</option>
        {months.map(m => (
          <option key={m.value} value={m.value} className="bg-[#111317] text-white">
            {m.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-zinc-500" />
    </div>
  );
}

export function PillDock({
  activeSection,
  onSelectSection,
  className = "",
}: {
  activeSection: "home" | "productivity" | "finance";
  onSelectSection: (section: "home" | "productivity" | "finance") => void;
  className?: string;
}) {
  const tabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "productivity" as const, label: "Productivity", icon: Zap },
    { id: "finance" as const, label: "Finance", icon: Wallet },
  ];

  return (
    <nav aria-label="Primary Navigation" className={`pill-dock inline-flex items-center p-1.5 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectSection(tab.id)}
            className={`relative flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs font-semibold tracking-tight transition-all duration-300 ${
              isActive
                ? "bg-white text-black shadow-lg shadow-white/20 scale-[1.02]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Icon size={14} className={isActive ? "text-black" : "text-zinc-400"} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function RadialProgress({
  value,
  size = 72,
  strokeWidth = 6.5,
  gradientId = "radGrad",
  color1 = "#22B8FF",
  color2 = "#2563FF",
  trackColor = "rgba(255, 255, 255, 0.07)",
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  gradientId?: string;
  color1?: string;
  color2?: string;
  trackColor?: string;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

export function WaveGraph({ className = "", height = 38 }: { className?: string; height?: number }) {
  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
      <svg viewBox="0 0 400 48" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="waveBlue" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#2563FF" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#22B8FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.5" />
          </linearGradient>
          <filter id="waveGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path
          d="M 0 30 Q 60 8 120 25 T 240 22 T 340 32 T 400 14"
          fill="none"
          stroke="url(#waveBlue)"
          strokeWidth="2.8"
          strokeLinecap="round"
          filter="url(#waveGlowFilter)"
        />
      </svg>
    </div>
  );
}

export function CrimsonHeatmap({
  data = [],
  className = "",
}: {
  data?: { day: string; time: string; count: number }[];
  className?: string;
}) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const times = ["9 am", "11 am", "1 pm", "3 pm", "5 pm", "7 pm"];

  // Activity level color classes for midnight navy, electric blue & cyan palette
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "heatmap-cell-1 bg-[#10264A] border border-[#1E3A8A]/60";
      case 2:
        return "heatmap-cell-2 bg-[#1E3A8A] border border-[#2563FF]/50 shadow-[0_0_8px_rgba(37,99,255,0.25)]";
      case 3:
        return "heatmap-cell-3 bg-[#2563FF] border border-[#3B82F6]/70 shadow-[0_0_12px_rgba(37,99,255,0.45)]";
      case 4:
        return "heatmap-cell-4 bg-[#22B8FF] border border-[#60A5FA] shadow-[0_0_16px_rgba(34,184,255,0.7)]";
      default:
        return "heatmap-cell-0 bg-white/[0.025] border border-white/[0.04]";
    }
  };

  // Deterministic seed simulation based on actual tasks or day patterns
  const getMatrixCell = (tIdx: number, dIdx: number) => {
    if (data && data.length > 0) {
      const match = data.find(d => d.day === days[dIdx] && d.time === times[tIdx]);
      if (match) return Math.min(4, Math.max(0, match.count));
    }
    // High activity centered around midday/afternoon as in reference image 5
    const distance = Math.abs(tIdx - 2.5) + Math.abs(dIdx - 3);
    if (distance < 1.2) return 4;
    if (distance < 2.2) return 3;
    if (distance < 3.2) return 2;
    if (distance < 4.2) return 1;
    return 0;
  };

  return (
    <div className={`liquid-card p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-tight text-white">Active days & hours</p>
          <p className="text-[10px] text-zinc-500">Activity density rhythm</p>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500">
          <span>Less</span>
          <span className="h-2.5 w-2.5 rounded-sm heatmap-legend-0 bg-white/[0.03] border border-white/[0.06]" />
          <span className="h-2.5 w-2.5 rounded-sm heatmap-legend-1 bg-[#10264A] border border-[#1E3A8A]/60" />
          <span className="h-2.5 w-2.5 rounded-sm heatmap-legend-2 bg-[#1E3A8A] border border-[#2563FF]/50" />
          <span className="h-2.5 w-2.5 rounded-sm heatmap-legend-3 bg-[#2563FF] border border-[#3B82F6]/70" />
          <span className="h-2.5 w-2.5 rounded-sm heatmap-legend-4 bg-[#22B8FF] border border-[#60A5FA]" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-1.5 text-center text-[9px] text-zinc-500 mb-2">
            <span />
            {days.map((d) => (
              <span key={d} className="font-medium text-zinc-400">{d}</span>
            ))}
          </div>

          <div className="space-y-1.5">
            {times.map((time, tIdx) => (
              <div key={time} className="grid grid-cols-[50px_repeat(7,1fr)] gap-1.5 items-center">
                <span className="text-[9px] text-zinc-500 text-left font-mono">{time}</span>
                {days.map((d, dIdx) => {
                  const level = getMatrixCell(tIdx, dIdx);
                  return (
                    <div
                      key={d}
                      className={`h-7 rounded-lg transition-transform hover:scale-110 cursor-pointer ${getLevelColor(level)}`}
                      title={`${d} at ${time}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


