import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Plus, Clock, Sparkles, ArrowUpRight, CreditCard,
  ChevronRight, ChevronDown, Activity, Zap, ShoppingBag, Utensils,
  Receipt, Home, Wallet, Car, Film, Tv, Pencil, Trash2, X
} from "lucide-react";
import { useAppData, type AppTask, type Priority } from "../context/AppDataContext";
import {
  LiquidCard, RadialProgress, WaveGraph, CrimsonHeatmap,
  formatMoney, pageClass, Modal, Field, Input, Select, Button, getLocalDateString
} from "../components/AppUI";

function SemicircleArc({
  segments,
}: {
  segments: { percent: number; color: string }[];
}) {
  const cx = 110;
  const cy = 100;
  const r = 78;
  const strokeWidth = 12;
  const circumference = Math.PI * r;

  let accumulatedPercent = 0;

  return (
    <svg viewBox="0 0 220 115" className="w-full max-w-[220px] overflow-visible">
      {/* Background track arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {segments.map((seg, idx) => {
        if (seg.percent <= 0) return null;
        const strokeLength = Math.max(2, seg.percent * circumference - (segments.length > 1 ? 6 : 0));
        const offset = accumulatedPercent * circumference;
        accumulatedPercent += seg.percent;

        return (
          <path
            key={idx}
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeLength} ${circumference * 2}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        );
      })}
    </svg>
  );
}

function SegmentedTickBar({
  value,
  max,
  colorClass,
  ticksCount = 24,
}: {
  value: number;
  max: number;
  colorClass: string;
  ticksCount?: number;
}) {
  const fraction = max > 0 ? Math.min(1, value / max) : 0;
  const activeCount = Math.max(value > 0 ? 1 : 0, Math.round(fraction * ticksCount));

  return (
    <div className="flex items-center gap-[3px] py-1">
      {Array.from({ length: ticksCount }, (_, i) => (
        <div
          key={i}
          className={`h-3 w-1 rounded-full transition-all duration-300 ${
            i < activeCount ? colorClass : "bg-white/[0.06]"
          }`}
        />
      ))}
    </div>
  );
}

function getCategoryConfig(name: string, index: number) {
  const normalized = name.toLowerCase();
  if (normalized.includes("transport") || normalized.includes("travel") || normalized.includes("commute") || normalized.includes("metro")) {
    return {
      color: "text-sky-400",
      tickBg: "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.6)]",
      icon: Car,
    };
  }
  if (normalized.includes("food") || normalized.includes("dine") || normalized.includes("beverage") || normalized.includes("coffee") || normalized.includes("lunch")) {
    return {
      color: "text-emerald-400",
      tickBg: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
      icon: Utensils,
    };
  }
  if (normalized.includes("shop")) {
    return {
      color: "text-pink-400",
      tickBg: "bg-pink-400 shadow-[0_0_6px_rgba(236,72,153,0.6)]",
      icon: ShoppingBag,
    };
  }
  if (normalized.includes("subscrip") || normalized.includes("recharge")) {
    return {
      color: "text-purple-400",
      tickBg: "bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.6)]",
      icon: Tv,
    };
  }
  if (normalized.includes("entertain") || normalized.includes("movie")) {
    return {
      color: "text-amber-400",
      tickBg: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
      icon: Film,
    };
  }
  if (normalized.includes("house") || normalized.includes("rent") || normalized.includes("grocer")) {
    return {
      color: "text-indigo-400",
      tickBg: "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]",
      icon: Home,
    };
  }
  if (normalized.includes("util") || normalized.includes("bill")) {
    return {
      color: "text-cyan-400",
      tickBg: "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]",
      icon: Receipt,
    };
  }
  if (normalized.includes("emi") || normalized.includes("loan")) {
    return {
      color: "text-blue-400",
      tickBg: "bg-blue-400 shadow-[0_0_6px_rgba(37,99,255,0.6)]",
      icon: CreditCard,
    };
  }

  const fallbacks = [
    { color: "text-blue-400", tickBg: "bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.6)]", icon: Wallet },
    { color: "text-pink-400", tickBg: "bg-pink-400 shadow-[0_0_6px_rgba(236,72,153,0.6)]", icon: ShoppingBag },
    { color: "text-emerald-400", tickBg: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]", icon: Utensils },
    { color: "text-cyan-400", tickBg: "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]", icon: Receipt },
    { color: "text-indigo-400", tickBg: "bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]", icon: Sparkles },
  ];
  return fallbacks[index % fallbacks.length];
}

function Dashboard() {
  const { data, setTasks } = useAppData();
  const navigate = useNavigate();

  // 1. Live Digital Clock & Greeting
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = useMemo(() => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentTime]);

  const displayName = useMemo(() => {
    try {
      const s = JSON.parse(localStorage.getItem("pulse-settings") || "{}");
      return s.name || "Anand";
    } catch {
      return "Anand";
    }
  }, []);

  const dateString = useMemo(() => {
    return currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [currentTime]);

  // 2. Productivity & Tasks metrics - 100% connected to real data
  const today = useMemo(() => getLocalDateString(currentTime), [currentTime]);

  const tasksToday = useMemo(() => {
    return data.tasks.filter(t => t.date === today || (!t.completed && t.date <= today));
  }, [data.tasks, today]);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AppTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    category: "Personal",
    priority: "Medium" as Priority,
    date: today,
    time: "09:00",
  });

  const openNewTask = () => {
    setEditingTask(null);
    setTaskForm({ title: "", category: "Personal", priority: "Medium", date: today, time: "09:00" });
    setTaskModalOpen(true);
  };

  const openEditTask = (t: AppTask) => {
    setEditingTask(t);
    setTaskForm({
      title: t.title,
      category: t.category,
      priority: t.priority,
      date: t.date || today,
      time: t.time || "09:00",
    });
    setTaskModalOpen(true);
  };

  const saveTask = () => {
    if (!taskForm.title.trim()) return;
    if (editingTask) {
      setTasks(list => list.map(t => (t.id === editingTask.id ? { ...t, ...taskForm } : t)));
    } else {
      setTasks(list => [...list, { ...taskForm, id: Date.now(), completed: false }]);
    }
    setTaskModalOpen(false);
  };

  const deleteTask = (id: number) => {
    setTasks(list => list.filter(t => t.id !== id));
  };

  const doneToday = tasksToday.filter(t => t.completed).length;
  const taskRate = tasksToday.length ? Math.round((doneToday / tasksToday.length) * 100) : 0;
  const habitToday = data.habits.filter(h => h.completedDates.includes(today)).length;
  const habitRate = data.habits.length ? Math.round((habitToday / data.habits.length) * 100) : 0;

  // Real, dynamic productivity score connected directly to tasks & habits
  const productivityScore = useMemo(() => {
    const hasTasks = tasksToday.length > 0;
    const hasHabits = data.habits.length > 0;

    if (!hasTasks && !hasHabits) return 0;
    if (hasTasks && hasHabits) return Math.round(taskRate * 0.6 + habitRate * 0.4);
    if (hasTasks) return taskRate;
    return habitRate;
  }, [tasksToday.length, data.habits.length, taskRate, habitRate]);

  // Dynamic status text & color based on actual completion
  const scoreStatus = useMemo(() => {
    if (tasksToday.length === 0 && data.habits.length === 0) {
      return { label: "No tasks scheduled", color: "text-zinc-500" };
    }
    if (productivityScore === 100) {
      return { label: "All Completed Today!", color: "text-emerald-400" };
    }
    if (productivityScore >= 75) {
      return { label: "Great Execution Pace", color: "text-emerald-400" };
    }
    if (productivityScore >= 50) {
      return { label: "Steady Momentum", color: "text-amber-400" };
    }
    if (productivityScore > 0) {
      return { label: "In Progress", color: "text-cyan-400" };
    }
    return { label: "Not started yet", color: "text-zinc-400" };
  }, [tasksToday.length, data.habits.length, productivityScore]);

  // Dynamic habit & task streak
  const activeStreak = useMemo(() => {
    const habitStreaks = data.habits.map(h => h.streak || 0);
    return habitStreaks.length ? Math.max(0, ...habitStreaks) : 0;
  }, [data.habits]);

  // 3. Financial Spends & Budget Month State - Synced with Finance
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const [spendingMonth, setSpendingMonth] = useState<string>(currentMonthKey);

  // Month list for pills & dropdown (recent 6 months)
  const availableMonthsList = useMemo(() => {
    const list: { key: string; label: string; short: string }[] = [];
    const base = new Date();
    for (let i = 5; i >= 0; i--) {
      // Day 15 guarantees timezone offsets never cross month boundaries
      const d = new Date(base.getFullYear(), base.getMonth() - i, 15);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      list.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        short: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }
    return list;
  }, []);

  // Filtered transactions for the selected month
  const monthExpenses = useMemo(() => {
    return (data.transactions || []).filter(
      t => t.type === "expense" && t.date && t.date.startsWith(spendingMonth)
    );
  }, [data.transactions, spendingMonth]);

  const totalMonthExpense = useMemo(() => {
    return monthExpenses.reduce((s, t) => s + t.amount, 0);
  }, [monthExpenses]);

  // Budget limit calculation - synced with Finance Cockpit & Budgets
  const totalBudgetLimit = useMemo(() => {
    const sum = (data.budgets || []).reduce((s, b) => s + (b.limit || 0), 0);
    if (sum > 0) return sum;
    const monthIncome = (data.transactions || [])
      .filter(t => t.type === "income" && t.date && t.date.startsWith(spendingMonth))
      .reduce((s, t) => s + t.amount, 0);
    if (monthIncome > 0) return monthIncome;
    const anyIncome = (data.transactions || [])
      .filter(t => t.type === "income")
      .reduce((s, t) => Math.max(s, t.amount), 0);
    return anyIncome > 0 ? anyIncome : (totalMonthExpense > 0 ? totalMonthExpense * 1.2 : 25000);
  }, [data.budgets, data.transactions, spendingMonth, totalMonthExpense]);

  const budgetSpentPercent = totalBudgetLimit > 0
    ? Math.min(100, Math.round((totalMonthExpense / totalBudgetLimit) * 100))
    : 0;

  const budgetRemaining = Math.max(0, totalBudgetLimit - totalMonthExpense);

  // Category spending breakdown for Image 2
  const categorySpends = useMemo(() => {
    const grouped: Record<string, number> = {};
    monthExpenses.forEach(t => {
      const cat = t.category || "General";
      grouped[cat] = (grouped[cat] || 0) + t.amount;
    });

    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [monthExpenses]);

  const arcSegments = useMemo(() => {
    const total = categorySpends.reduce((s, c) => s + c.amount, 0);
    if (total > 0) {
      const colorMap: Record<string, string> = {
        "text-sky-400": "#38bdf8",
        "text-emerald-400": "#34d399",
        "text-pink-400": "#f472b6",
        "text-purple-400": "#c084fc",
        "text-amber-400": "#fbbf24",
        "text-indigo-400": "#818cf8",
        "text-cyan-400": "#22d3ee",
        "text-orange-400": "#3b82f6",
        "text-blue-400": "#60a5fa",
      };
      return categorySpends.map((c, i) => {
        const conf = getCategoryConfig(c.name, i);
        return {
          percent: c.amount / total,
          color: colorMap[conf.color] || "#2563FF",
        };
      });
    }
    return [];
  }, [categorySpends]);

  // 4. Toggle Task Completion
  const toggleTask = (task: AppTask) => {
    setTasks(list =>
      list.map(t => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
  };

  // 5. Weekly Activity data - 100% connected to real activity
  const weeklyBars = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayTasks = data.tasks.filter(t => t.date === key);
      const dayHabits = data.habits.filter(h => h.completedDates.includes(key));
      const totalItems = dayTasks.length + data.habits.length;
      const completedItems = dayTasks.filter(t => t.completed).length + dayHabits.length;
      const rate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        rate,
        isToday: key === today,
      };
    });
  }, [data.tasks, data.habits, today]);

  // 6. Upcoming Events & EMI Dues
  const activeEmis = (data.emis || []).filter(e => e.paidMonths < e.totalTenureMonths);
  const emiDueSoon = activeEmis.filter(e => {
    const isPaid = e.lastPaidDate?.startsWith(today.slice(0, 7));
    if (isPaid) return false;
    const diff = e.dueDay - currentTime.getDate();
    return diff <= 7;
  });

  const upcomingEvents = useMemo(() => {
    return [...data.calendarEvents]
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [data.calendarEvents, today]);

  return (
    <div className={pageClass}>
      {/* Top Grid: Greeting Card & Date/Momentum */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Main Greeting Card with Glowing Wave */}
        <LiquidCard className="relative overflow-hidden p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#22B8FF]">
                Command Center
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {greeting}, <span className="text-white">{displayName}</span>
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Stay focused and make it happen.
              </p>
            </div>

            {/* Live Clock Pill */}
            <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.05] px-3.5 py-1.5 backdrop-blur-xl shadow-sm">
              <Clock size={13} className="text-[#22B8FF] animate-pulse" />
              <span className="font-mono text-xs font-semibold tracking-wider text-white">
                {timeString}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>System Status: <strong className="text-white">Active</strong></span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">{dateString}</p>
          </div>
        </LiquidCard>

        {/* Momentum & Rhythm */}
        <LiquidCard className="p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Momentum
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${
                activeStreak > 0
                  ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                  : "bg-white/[0.04] text-zinc-400 border-white/[0.08]"
              }`}>
                {activeStreak > 0 ? "Active Streak" : "Ready to Start"}
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-white">{activeStreak}</span>
              <span className="text-xs font-medium text-zinc-400">
                {activeStreak === 1 ? "Day consistent" : "Days consistent"}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {activeStreak > 0
                ? "High rhythm across tasks, habits and financial discipline."
                : "Complete tasks and habits daily to build your momentum streak."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Sparkles size={14} className={activeStreak > 0 ? "text-[#22B8FF]" : "text-zinc-500"} />
              <span>Status: <strong className="text-white">{activeStreak > 0 ? "Peak Flow" : "Standby"}</strong></span>
            </div>
            <button
              onClick={() => navigate("/productivity")}
              className="text-xs font-medium text-[#22B8FF] hover:text-[#60A5FA] transition flex items-center gap-1"
            >
              Open Hub <ArrowUpRight size={13} />
            </button>
          </div>
        </LiquidCard>
      </div>

      {/* Row 2: Productivity Overview & Current Flow State */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Productivity Today Card with Radial Ring */}
        <LiquidCard className="p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Productivity Score
            </p>
            <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] text-zinc-400 border border-white/[0.07]">
              Today
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight text-white">
                  {productivityScore}%
                </span>
              </div>
              <p className={`mt-1 text-xs font-semibold ${scoreStatus.color}`}>
                {scoreStatus.label}
              </p>
              <div className="mt-3 space-y-1 text-xs text-zinc-400">
                <p>Completed: <strong className="text-white">{doneToday}</strong></p>
                <p>Total Tasks: <strong className="text-white">{tasksToday.length}</strong></p>
                <p>Habits Consistency: <strong className="text-white">{habitRate}%</strong></p>
              </div>
            </div>

            <RadialProgress
              value={productivityScore}
              size={92}
              strokeWidth={8}
              color1="#22B8FF"
              color2="#2563FF"
            >
              <Zap size={24} className={productivityScore > 0 ? "text-[#22B8FF]" : "text-zinc-500"} />
            </RadialProgress>
          </div>
        </LiquidCard>

        {/* Current Mood / Focus Energy */}
        <LiquidCard className="p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Current Rhythm
            </p>
            <span className={`flex items-center gap-1 text-[10px] font-medium ${productivityScore > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${productivityScore > 0 ? "bg-emerald-400 animate-ping" : "bg-zinc-600"}`} />
              {productivityScore >= 75 ? "Focused" : productivityScore > 0 ? "Active" : "Standby"}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-white">
                  {productivityScore >= 75
                    ? "Deep Flow Mode"
                    : productivityScore >= 40
                    ? "Active Momentum"
                    : productivityScore > 0
                    ? "Getting Started"
                    : "Ready to Begin"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Tasks Today: <strong className={tasksToday.length > 0 ? "text-emerald-400" : "text-zinc-400"}>{tasksToday.length ? `${doneToday}/${tasksToday.length} Done` : "None scheduled"}</strong>
                </p>
              </div>
              <Activity size={24} className={productivityScore > 0 ? "text-[#22B8FF]" : "text-zinc-600"} />
            </div>

            <div className="mt-4 pt-1">
              <WaveGraph height={34} />
            </div>

            <div className="mt-4 flex justify-between text-[10px] text-zinc-500 border-t border-white/[0.06] pt-3">
              <span>Energy: <strong className="text-zinc-300">{productivityScore > 50 ? "High" : productivityScore > 0 ? "Moderate" : "Resting"}</strong></span>
              <span>Clarity: <strong className="text-zinc-300">{productivityScore > 50 ? "Optimal" : "Clear"}</strong></span>
            </div>
          </div>
        </LiquidCard>
      </div>

      {/* Row 3: Tasks Checklist & Weekly Activity */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Today's Tasks Interactive Checklist */}
        <LiquidCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <p className="text-base font-bold text-white">Today's Tasks</p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                {tasksToday.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openNewTask}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition rounded-lg px-2 py-1 bg-white/[0.04] hover:bg-white/[0.08]"
              >
                <Plus size={14} className="text-[#22B8FF]" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {tasksToday.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t)}
                className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3.5 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(t);
                    }}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition ${
                      t.completed
                        ? "bg-[#2563FF] text-white shadow-sm shadow-blue-500/50"
                        : "border border-white/20 text-transparent hover:border-white/40"
                    }`}
                  >
                    <CheckCircle2 size={13} className={t.completed ? "block" : "hidden"} />
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-medium transition ${
                        t.completed ? "text-zinc-500 line-through" : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {t.title}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {t.category} {t.time ? `· ${t.time}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[9px] font-semibold tracking-wider uppercase ${
                      t.completed
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    }`}
                  >
                    {t.completed ? "Completed" : "In Progress"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditTask(t);
                    }}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/[0.08] hover:text-white transition"
                    title="Edit task"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(t.id);
                    }}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/15 hover:text-red-300 transition"
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {!tasksToday.length && (
              <p className="py-8 text-center text-xs text-zinc-500">
                No tasks scheduled for today. Click Add to create one.
              </p>
            )}
          </div>
        </LiquidCard>

        {/* Weekly Activity Bar Chart */}
        <LiquidCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">Weekly Activity</p>
              <p className="text-xs text-zinc-500">Completion rate across 7 days</p>
            </div>
            <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-400">
              This Week
            </span>
          </div>

          <div className="mt-6 flex h-48 items-end justify-between gap-3 px-2">
            {weeklyBars.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-36 w-full items-end justify-center rounded-xl bg-white/[0.03] p-1">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      item.isToday
                        ? item.rate > 0
                          ? "bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_12px_rgba(34,184,255,0.6)]"
                          : "bg-blue-500/30"
                        : item.rate > 0
                        ? "bg-gradient-to-t from-blue-950/70 to-blue-700/60 hover:from-blue-900 hover:to-blue-600"
                        : "bg-white/[0.05]"
                    }`}
                    style={{ height: item.rate > 0 ? `${item.rate}%` : "4px" }}
                    title={`${item.day}: ${item.rate}%`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    item.isToday ? "text-[#22B8FF] font-bold" : "text-zinc-500"
                  }`}
                >
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </LiquidCard>
      </div>

      {/* Row 4: Upcoming Events & Heatmap ("Active days & hours / Activity density rhythm") */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        {/* Events & Repayments */}
        <LiquidCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-white">Schedule & Repayments</p>
              <p className="text-xs text-zinc-500">Upcoming commitments</p>
            </div>
            <button
              onClick={() => navigate("/calendar")}
              className="text-xs text-[#22B8FF] hover:text-[#60A5FA] transition flex items-center gap-1"
            >
              Timeline <ChevronRight size={13} />
            </button>
          </div>

          {/* EMI Dues alert banner if any */}
          {emiDueSoon.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard size={16} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-200">
                      {emiDueSoon.length} EMI Repayment{emiDueSoon.length > 1 ? "s" : ""} Due Soon
                    </p>
                    <p className="text-[10px] text-amber-300/80">
                      Total: {formatMoney(emiDueSoon.reduce((s, e) => s + e.monthlyEmi, 0))}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/emi")}
                  className="rounded-xl bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold text-amber-200 hover:bg-amber-500/30 transition"
                >
                  Pay Now
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {upcomingEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
              >
                <div>
                  <p className="text-xs font-medium text-white">{ev.title}</p>
                  <p className="text-[10px] text-zinc-500">
                    {ev.date} {ev.time ? `· ${ev.time}` : ""} · {ev.category}
                  </p>
                </div>
                <span className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-[9px] text-zinc-400 border border-white/[0.06]">
                  Upcoming
                </span>
              </div>
            ))}

            {!upcomingEvents.length && !emiDueSoon.length && (
              <p className="py-8 text-center text-xs text-zinc-600">
                No upcoming events or EMI dues for today.
              </p>
            )}
          </div>
        </LiquidCard>

        {/* Activity Heatmap Grid: "Active days & hours / Activity density rhythm" */}
        <CrimsonHeatmap />
      </div>

      {/* Row 5: Financial Command (PLACED AFTER Active days & hours Heatmap as requested!) */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2 items-stretch">
        {/* Card 1: Monthly Budget & Spending Limit (Image 3) */}
        <LiquidCard className="p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-zinc-400 tracking-wide">
                Monthly Budget
              </p>
              {/* Sleek Month Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={spendingMonth}
                  onChange={(e) => setSpendingMonth(e.target.value)}
                  className="h-8 cursor-pointer appearance-none rounded-xl border border-white/[0.08] bg-white/[0.04] pl-3 pr-7 text-xs font-medium text-zinc-300 outline-none hover:bg-white/[0.08] transition"
                >
                  {availableMonthsList.map((m) => (
                    <option key={m.key} value={m.key} className="bg-[#0A1222] text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2.5 text-zinc-400" />
              </div>
            </div>

            {/* Big Headline Spending Limit */}
            <div className="mt-3">
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {formatMoney(totalBudgetLimit)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Monthly spending limit
              </p>
            </div>

            {/* Glowing Gradient Progress Bar */}
            <div className="mt-8">
              <div className="h-3 w-full rounded-full bg-white/[0.08] overflow-hidden p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shadow-[0_0_14px_rgba(37,99,255,0.5)] transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(3, budgetSpentPercent))}%` }}
                />
              </div>

              {/* Spent & Remaining Split */}
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 font-medium">Spent</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-white">
                      {formatMoney(totalMonthExpense)}
                    </span>
                    <span className="rounded-full bg-white/[0.08] border border-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                      {budgetSpentPercent}%
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-zinc-400 font-medium">Remaining</p>
                  <p className="mt-1 text-base sm:text-lg font-bold text-white">
                    {formatMoney(budgetRemaining)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* View Details Pill Button */}
          <div className="mt-8 pt-2">
            <button
              onClick={() => navigate("/finance")}
              className="w-full rounded-2xl border border-white/[0.1] bg-white/[0.03] py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.99] flex items-center justify-center gap-1.5"
            >
              View Details <ChevronRight size={13} className="text-zinc-400" />
            </button>
          </div>
        </LiquidCard>

        {/* Card 2: Expense Tracker by Category (Image 2) */}
        <LiquidCard className="p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-white tracking-tight">
                Expense Tracker
              </p>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                Categories
              </span>
            </div>

            {/* Semicircular Multi-Color Arch Gauge */}
            <div className="relative flex flex-col items-center justify-center my-3">
              <div className="relative flex items-center justify-center">
                <SemicircleArc segments={arcSegments} />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {formatMoney(totalMonthExpense)}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400 mt-0.5">
                    Total Expense
                  </span>
                </div>
              </div>
            </div>

            {/* Month Pills Row (Image 2 style) */}
            <div className="mt-3 flex items-center justify-center gap-1 overflow-x-auto pb-1">
              {availableMonthsList.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSpendingMonth(m.key)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    spendingMonth === m.key
                      ? "bg-[#2563FF] text-white font-bold shadow-md shadow-blue-600/40"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {m.short}
                </button>
              ))}
            </div>

            {/* Category Breakdown with Segmented LED Tick Bars */}
            <div className="mt-5 space-y-3.5">
              {categorySpends.map((item, idx) => {
                const config = getCategoryConfig(item.name, idx);
                const Icon = config.icon;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.07] ${config.color}`}>
                          <Icon size={13} />
                        </div>
                        <span className="text-xs font-medium text-zinc-200">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white tracking-tight">{formatMoney(item.amount)}</span>
                    </div>
                    <div className="pl-9">
                      <SegmentedTickBar
                        value={item.amount}
                        max={totalMonthExpense > 0 ? totalMonthExpense : 100}
                        colorClass={config.tickBg}
                        ticksCount={24}
                      />
                    </div>
                  </div>
                );
              })}

              {categorySpends.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-500">
                  No expenses recorded for this month.
                </p>
              )}
            </div>
          </div>
        </LiquidCard>
      </div>

      {/* Add / Edit Task Modal */}
      <Modal open={taskModalOpen} title={editingTask ? "Edit task" : "Add task"} onClose={() => setTaskModalOpen(false)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input
              autoFocus
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="What needs to happen?"
            />
          </Field>
          <Field label="Category">
            <Select
              value={taskForm.category}
              onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}
            >
              {["Personal", "Career", "Learning", "Finance", "Health"].map(c => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={taskForm.priority}
              onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
            >
              {["Low", "Medium", "High"].map(p => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={taskForm.time}
              onChange={e => setTaskForm({ ...taskForm, time: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={taskForm.date}
              onChange={e => setTaskForm({ ...taskForm, date: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {editingTask ? (
            <Button
              variant="danger"
              onClick={() => {
                deleteTask(editingTask.id);
                setTaskModalOpen(false);
              }}
            >
              <Trash2 size={13} className="mr-1.5 inline" />Delete
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setTaskModalOpen(false)}>
              <X size={14} className="mr-1.5 inline" />Cancel
            </Button>
            <Button onClick={saveTask}>
              {editingTask ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;
