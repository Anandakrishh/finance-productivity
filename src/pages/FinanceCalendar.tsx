import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Plus, ShoppingBag, Utensils, Receipt,
  Wallet, CreditCard, Home, Zap, X, Trash2
} from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { Button, Field, Input, LiquidCard, Modal, Select, formatMoney, pageClass, getLocalDateString } from "../components/AppUI";

const categories = ["Food & Dining", "Shopping", "Utility/Bills", "Transfers", "Transport", "Housing", "Entertainment", "Health", "Personal"];

function getCategoryConfig(category: string) {
  const norm = category.toLowerCase();
  if (norm.includes("food") || norm.includes("dine") || norm.includes("beverage")) {
    return {
      dot: "bg-emerald-400",
      iconBg: "bg-emerald-500/20 border border-emerald-500/30",
      iconColor: "text-emerald-400",
      icon: Utensils,
    };
  }
  if (norm.includes("shop")) {
    return {
      dot: "bg-pink-400",
      iconBg: "bg-pink-500/20 border border-pink-500/30",
      iconColor: "text-pink-400",
      icon: ShoppingBag,
    };
  }
  if (norm.includes("util") || norm.includes("bill") || norm.includes("electric")) {
    return {
      dot: "bg-amber-400",
      iconBg: "bg-amber-500/20 border border-amber-500/30",
      iconColor: "text-amber-400",
      icon: Zap,
    };
  }
  if (norm.includes("water") || norm.includes("trans")) {
    return {
      dot: "bg-sky-400",
      iconBg: "bg-sky-500/20 border border-sky-500/30",
      iconColor: "text-sky-400",
      icon: Receipt,
    };
  }
  if (norm.includes("house") || norm.includes("rent")) {
    return {
      dot: "bg-purple-400",
      iconBg: "bg-purple-500/20 border border-purple-500/30",
      iconColor: "text-purple-400",
      icon: Home,
    };
  }
  if (norm.includes("emi") || norm.includes("loan")) {
    return {
      dot: "bg-blue-400",
      iconBg: "bg-blue-500/20 border border-blue-500/30",
      iconColor: "text-blue-400",
      icon: CreditCard,
    };
  }
  return {
    dot: "bg-blue-400",
    iconBg: "bg-blue-500/20 border border-blue-500/30",
    iconColor: "text-blue-400",
    icon: Wallet,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const formatDateKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let firstDayIndex = firstDay.getDay() - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const d = new Date(year, month - 1, dayNum);
    days.push({
      date: d,
      isCurrentMonth: false,
      key: formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
    });
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({
      date: d,
      isCurrentMonth: true,
      key: formatDateKey(year, month, i),
    });
  }

  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      key: formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
    });
  }

  return days;
}

function FinanceCalendar() {
  const { data, setTransactions } = useAppData();
  const navigate = useNavigate();

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getLocalDateString(today), [today]);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food & Dining",
    account: "UPI",
  });

  const monthLabel = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const monthDays = useMemo(() => {
    return getMonthDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Pre-index expenses by date for instant dot badges
  const expensesByDate = useMemo(() => {
    const map: Record<string, { total: number; categories: string[] }> = {};
    (data.transactions || []).forEach(t => {
      if (t.type === "expense" && t.date) {
        if (!map[t.date]) map[t.date] = { total: 0, categories: [] };
        map[t.date].total += t.amount;
        const cat = t.category || "General";
        if (!map[t.date].categories.includes(cat)) {
          map[t.date].categories.push(cat);
        }
      }
    });
    return map;
  }, [data.transactions]);

  // Selected date expense details
  const selectedDateExpenses = useMemo(() => {
    return (data.transactions || []).filter(
      t => t.type === "expense" && t.date === selectedDateKey
    );
  }, [data.transactions, selectedDateKey]);

  const selectedDayTotal = useMemo(() => {
    return selectedDateExpenses.reduce((s, t) => s + t.amount, 0);
  }, [selectedDateExpenses]);

  // Group selected day's expenses by category
  const selectedDayCategories = useMemo(() => {
    const grouped: Record<string, { amount: number; count: number }> = {};
    selectedDateExpenses.forEach(t => {
      const cat = t.category || "General";
      if (!grouped[cat]) grouped[cat] = { amount: 0, count: 0 };
      grouped[cat].amount += t.amount;
      grouped[cat].count += 1;
    });

    return Object.entries(grouped)
      .map(([name, info]) => ({
        name,
        amount: info.amount,
        count: info.count,
        percent: selectedDayTotal > 0 ? Math.round((info.amount / selectedDayTotal) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [selectedDateExpenses, selectedDayTotal]);

  // Monthly stats
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const monthTotalExpense = useMemo(() => {
    return (data.transactions || [])
      .filter(t => t.type === "expense" && t.date?.startsWith(currentMonthPrefix))
      .reduce((s, t) => s + t.amount, 0);
  }, [data.transactions, currentMonthPrefix]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyAverage = Math.round(monthTotalExpense / daysInMonth);

  const topCategoryName = selectedDayCategories.length > 0 ? selectedDayCategories[0].name : "—";

  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDateKey.split("-");
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, [selectedDateKey]);

  const handleSaveExpense = () => {
    if (!form.title.trim() || !form.amount) return;
    const num = Number(form.amount);
    if (isNaN(num) || num <= 0) return;

    setTransactions(prev => [
      ...prev,
      {
        id: Date.now(),
        title: form.title.trim(),
        description: form.title.trim(),
        amount: num,
        type: "expense",
        category: form.category,
        account: form.account,
        date: selectedDateKey,
      },
    ]);

    setForm({
      title: "",
      amount: "",
      category: "Food & Dining",
      account: "UPI",
    });
    setShowAddModal(false);
  };

  const handleDeleteExpense = (id: number) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={pageClass}>
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Finance & Wealth
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Spending Calendar
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Click any date to inspect category expenses, breakdown percentages, and daily totals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/finance")}>
            Finance Cockpit
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={14} className="mr-1.5 inline" /> Add expense
          </Button>
        </div>
      </div>

      {/* Main Grid: Calendar Card (Image Replica) + Selected Day Breakdown Card */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: Monthly Usage Calendar (Replicating user's attached design) */}
        <LiquidCard className="p-6 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Header: Title + Month Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white tracking-tight">
                  Monthly usage
                </p>
                <p className="text-xs text-zinc-500">
                  {monthLabel} · {formatMoney(monthTotalExpense)} total
                </p>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
                <button
                  onClick={prevMonth}
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition"
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-mono text-xs font-medium text-white">
                  {new Date(currentYear, currentMonth, 1).toLocaleDateString("en-US", { month: "short" })}
                </span>
                <button
                  onClick={nextMonth}
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition"
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekdays Header: Mo Tu We Th Fr Sa Su */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500 mb-2">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-y-2.5 gap-x-1 text-center">
              {monthDays.map((d) => {
                const dayNum = d.date.getDate();
                const isSelected = d.key === selectedDateKey;
                const isToday = d.key === todayKey;
                const dayExpense = expensesByDate[d.key];
                const dayCategories = dayExpense ? dayExpense.categories.slice(0, 3) : [];

                return (
                  <button
                    key={d.key}
                    onClick={() => setSelectedDateKey(d.key)}
                    className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${
                      isSelected
                        ? "bg-white text-black font-extrabold shadow-lg shadow-white/20 scale-105"
                        : d.isCurrentMonth
                        ? "text-zinc-200 hover:bg-white/[0.06]"
                        : "text-zinc-600 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="text-xs">
                      {dayNum}
                    </span>

                    {/* Category Dots under date (Image Replica: 3 dots) */}
                    <div className="mt-1 flex h-1.5 items-center justify-center gap-1">
                      {dayCategories.length > 0 ? (
                        dayCategories.map((cat, i) => {
                          const conf = getCategoryConfig(cat);
                          return (
                            <span
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-black" : conf.dot}`}
                            />
                          );
                        })
                      ) : (
                        <span className="h-1.5 w-1.5 opacity-0" />
                      )}
                    </div>

                    {isToday && !isSelected && (
                      <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-[#2563FF]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metric Summary Row below Calendar (Image Replica: 3 columns) */}
          <div className="mt-8 grid grid-cols-3 divide-x divide-white/[0.08] border-t border-white/[0.08] pt-4 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Total Spent</p>
              <p className="mt-1 text-base font-bold text-white">{formatMoney(selectedDayTotal)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Daily Avg</p>
              <p className="mt-1 text-base font-bold text-white">{formatMoney(dailyAverage)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Top Category</p>
              <p className="mt-1 text-xs font-bold text-white truncate px-1">{topCategoryName}</p>
            </div>
          </div>
        </LiquidCard>

        {/* Right: Category Spends Breakdown for Selected Date */}
        <div className="space-y-4">
          <LiquidCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-bold text-white">
                  {selectedDateLabel}
                </p>
                <p className="text-xs text-zinc-400">
                  Daily Category Expense Breakdown
                </p>
              </div>

              <span className="rounded-full bg-[#2563FF]/15 border border-[#2563FF]/30 px-3 py-1 text-xs font-bold text-[#60A5FA]">
                {formatMoney(selectedDayTotal)}
              </span>
            </div>

            {/* Category Cards (Replicating Image cards with rounded pill, icon, usage & percentage) */}
            <div className="space-y-3 mt-4">
              {selectedDayCategories.map((item) => {
                const conf = getCategoryConfig(item.name);
                const Icon = conf.icon;

                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 transition hover:bg-white/[0.05] hover:border-white/[0.1]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${conf.iconBg} ${conf.iconColor}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {item.name}
                        </p>
                        <p className="text-xs text-zinc-400 font-medium mt-0.5">
                          {formatMoney(item.amount)} · {item.count} transaction{item.count > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-white">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {!selectedDayCategories.length && (
                <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                  <p className="text-sm font-medium text-zinc-300">No expenses on this day</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    A clean slate! Click below if you want to record an expense for this date.
                  </p>
                  <div className="mt-4">
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus size={13} className="mr-1.5 inline" /> Record expense
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </LiquidCard>

          {/* Individual Transactions for this date */}
          {selectedDateExpenses.length > 0 && (
            <LiquidCard className="p-5">
              <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Transactions list ({selectedDateExpenses.length})
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-medium text-[#22B8FF] hover:text-[#60A5FA] transition flex items-center gap-1"
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {selectedDateExpenses.map(t => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">{t.title || t.description}</p>
                      <p className="text-[10px] text-zinc-500">{t.category} · {t.account || "Cash"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#60A5FA]">
                        -{formatMoney(t.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(t.id)}
                        className="rounded-lg p-1 text-zinc-500 hover:bg-red-500/15 hover:text-red-300 transition"
                        title="Delete transaction"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </LiquidCard>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal open={showAddModal} title={`Add expense for ${selectedDateLabel}`} onClose={() => setShowAddModal(false)}>
        <div className="grid gap-4">
          <Field label="Description / Merchant">
            <Input
              autoFocus
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Grocery store, Uber, Dinner"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (₹)">
              <Input
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="250"
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Payment Account / Mode">
            <Select
              value={form.account}
              onChange={e => setForm({ ...form, account: e.target.value })}
            >
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cash">Cash</option>
            </Select>
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowAddModal(false)}>
            <X size={14} className="mr-1 inline" /> Cancel
          </Button>
          <Button onClick={handleSaveExpense}>
            Save Expense
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default FinanceCalendar;
