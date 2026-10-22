import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Search, Trash2, Pencil, FileSpreadsheet } from "lucide-react";
import { useAppData, type AppTransaction, type TransactionType } from "../context/AppDataContext";
import { Button, Field, Input, LiquidCard, Modal, Select, MonthSelect, formatMoney, formatDate, pageClass, parseTransactionDate } from "../components/AppUI";
import { exportFinancialStatementExcel } from "../lib/exportFinancialExcel";

const categories = ["Salary", "Freelance", "Housing", "Food", "Shopping", "Transport", "Subscriptions", "Health", "Entertainment", "Other"];
const accounts = ["Bank Account", "Credit Card", "UPI", "Cash"];

/**
 * Returns the current month key dynamically formatted as "YYYY-MM" (e.g., "2026-10")
 * according to the user's local calendar time.
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Returns today's ISO date (YYYY-MM-DD) in local timezone to avoid UTC day-shift bugs.
 */
function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Transactions() {
  const { data, setTransactions } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  // Default to the current month & year dynamically at runtime (e.g., "2026-10")
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<AppTransaction | null>(null);
  const [form, setForm] = useState({
    description: "",
    category: "Food",
    amount: "",
    date: getTodayIsoDate(),
    type: "expense" as TransactionType,
    account: "UPI",
  });
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      if (selectedMonth !== "all") {
        const [y, m] = selectedMonth.split("-").map(Number);
        if (y && m) {
          const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
          const lastDay = new Date(y, m, 0).getDate();
          const endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
          await exportFinancialStatementExcel(data, { startDate, endDate });
          return;
        }
      }
      await exportFinancialStatementExcel(data);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel statement.");
    } finally {
      setExportingExcel(false);
    }
  };

  // 1. Filter transactions by the selected month & year (or all time if "all")
  const monthTransactions = useMemo(() => {
    if (selectedMonth === "all") return data.transactions;
    const [targetYear, targetMonth] = selectedMonth.split("-").map(Number);
    if (!targetYear || !targetMonth) return data.transactions;
    return data.transactions.filter(t => {
      const parsed = parseTransactionDate(t.date);
      return Boolean(parsed && parsed.year === targetYear && parsed.month === targetMonth);
    });
  }, [data.transactions, selectedMonth]);

  // 2. Visible transactions after search query and type filter (income/expense)
  const visibleTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monthTransactions
      .filter(t => {
        const matchesType = filter === "all" || t.type === filter;
        if (!matchesType) return false;
        if (!q) return true;
        const text = `${t.description || ""} ${t.category || ""} ${t.account || ""}`.toLowerCase();
        return text.includes(q);
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [monthTransactions, filter, query]);

  // 3. Keep summaries synchronized with visible transactions
  const income = useMemo(
    () => visibleTransactions.filter(t => t.type === "income").reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [visibleTransactions]
  );
  const expenses = useMemo(
    () => visibleTransactions.filter(t => t.type === "expense").reduce((s, t) => s + (Number(t.amount) || 0), 0),
    [visibleTransactions]
  );
  const netFlow = income - expenses;
  const entriesCount = visibleTransactions.length;

  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === "all") return "All Time";
    const [y, m] = selectedMonth.split("-").map(Number);
    if (!y || !m) return "All Time";
    return new Date(y, m - 1, 15).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, [selectedMonth]);

  const openNew = () => {
    setEditing(null);
    const today = getTodayIsoDate();
    const defaultDate = selectedMonth !== "all" && !today.startsWith(selectedMonth) ? `${selectedMonth}-01` : today;
    setForm({ description: "", category: "Food", amount: "", date: defaultDate, type: "expense", account: "UPI" });
    setShow(true);
  };

  const edit = (t: AppTransaction) => {
    setEditing(t);
    setForm({
      description: t.description,
      category: t.category,
      amount: String(t.amount),
      date: t.date,
      type: t.type,
      account: t.account || "UPI",
    });
    setShow(true);
  };

  const save = () => {
    if (!form.description || !form.amount) return;
    const payload = {
      description: form.description,
      title: form.description,
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      type: form.type,
      account: form.account,
    };
    if (editing) {
      setTransactions(l => l.map(t => (t.id === editing.id ? { ...t, ...payload } : t)));
    } else {
      setTransactions(l => [{ id: Date.now(), ...payload }, ...l]);
    }
    setShow(false);
  };

  return (
    <div className={pageClass}>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Money flow</p>
          <h1 className="text-3xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-zinc-500">One source of truth for income and spending.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <MonthSelect
            value={selectedMonth}
            onChange={setSelectedMonth}
            transactions={data.transactions}
          />
          <Button 
            variant="ghost" 
            className="border border-white/[.08] text-zinc-300 hover:text-white"
            onClick={handleExportExcel}
            disabled={exportingExcel}
          >
            <FileSpreadsheet size={14} className="mr-2 inline text-[#22B8FF]" />
            {exportingExcel ? "Exporting..." : "Export Excel (.xlsx)"}
          </Button>
          <Button onClick={openNew}>
            <Plus size={14} className="mr-2 inline" />Add transaction
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Income" value={formatMoney(income)} detail={selectedMonth !== "all" ? selectedMonthLabel : undefined} />
        <Kpi label="Expenses" value={formatMoney(expenses)} detail={selectedMonth !== "all" ? selectedMonthLabel : undefined} />
        <Kpi label="Net flow" value={formatMoney(netFlow)} detail={selectedMonth !== "all" ? selectedMonthLabel : undefined} />
        <Kpi label="Entries" value={entriesCount} detail={selectedMonth !== "all" ? `in ${selectedMonthLabel}` : "all time"} />
      </div>

      <LiquidCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-zinc-600" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search transactions..." className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["all", "income", "expense"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-3 py-2 text-[10px] uppercase tracking-wider transition ${filter === f ? "bg-white text-black font-semibold" : "bg-white/[.03] text-zinc-500 hover:text-zinc-300"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {selectedMonth !== "all" && (
              <button
                onClick={() => setSelectedMonth("all")}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-zinc-400 hover:text-white transition"
                title="Clear month filter and view all months"
              >
                Clear month ({selectedMonthLabel})
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-white/[.05]">
          {visibleTransactions.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-4 transition hover:bg-white/[0.02]">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.type === "income" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                {t.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-zinc-300 font-medium">{t.description}</p>
                <p className="mt-1 text-[9px] text-zinc-500">{t.category} · {t.account || "Account"} · {formatDate(t.date)}</p>
              </div>
              <p className={`text-xs font-semibold ${t.type === "income" ? "text-emerald-300" : "text-zinc-200"}`}>
                {t.type === "income" ? "+" : "-"}{formatMoney(t.amount)}
              </p>
              <button onClick={() => edit(t)} className="p-2 text-zinc-600 hover:text-white transition" title="Edit">
                <Pencil size={13} />
              </button>
              <button onClick={() => setTransactions(l => l.filter(x => x.id !== t.id))} className="p-2 text-zinc-600 hover:text-red-300 transition" title="Delete">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {!visibleTransactions.length && (
            <div className="p-12 text-center text-xs">
              <p className="font-medium text-zinc-400">
                {query.trim()
                  ? `No transactions matching "${query}"`
                  : `No transactions found ${selectedMonth !== "all" ? `for ${selectedMonthLabel}` : ""}`}
              </p>
              <p className="mt-1.5 text-[11px] text-zinc-600">
                {selectedMonth !== "all" ? (
                  <>
                    Try choosing another month, or{" "}
                    <button
                      onClick={() => setSelectedMonth("all")}
                      className="text-[#22B8FF] underline underline-offset-2 hover:text-[#55c8ff] transition"
                    >
                      view All Months
                    </button>
                    .
                  </>
                ) : (
                  "Add a transaction to get started."
                )}
              </p>
            </div>
          )}
        </div>
      </LiquidCard>

      <Modal open={show} title={editing ? "Edit transaction" : "Add transaction"} onClose={() => setShow(false)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description">
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Salary, groceries, rent..." />
          </Field>
          <Field label="Amount">
            <Input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TransactionType })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Account">
            <Select value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}>
              {accounts.map(a => <option key={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={save}>{editing ? "Save changes" : "Add transaction"}</Button>
        </div>
      </Modal>
    </div>
  );
}

function Kpi({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <LiquidCard className="p-4">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {detail && <p className="mt-1 text-[9px] text-zinc-400">{detail}</p>}
    </LiquidCard>
  );
}

export default Transactions;
