import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, PiggyBank, ArrowUpRight, ArrowDownRight, Receipt, Target, CreditCard, CalendarDays, FileSpreadsheet } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAppData } from "../context/AppDataContext";
import { Button, LiquidCard, Metric, ProgressBar, MonthSelect, formatMoney, pageClass } from "../components/AppUI";
import { exportFinancialStatementExcel } from "../lib/exportFinancialExcel";

function Finance() {
  const { data, privacyMode } = useAppData();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportFinancialStatementExcel(data);
    } catch (err) {
      console.error("Excel export error:", err);
      alert("Failed to export Excel statement.");
    } finally {
      setExportingExcel(false);
    }
  };

  const activeEmis = (data.emis || []).filter(e => e.paidMonths < e.totalTenureMonths);
  const emiMonthly = activeEmis.reduce((s, e) => s + e.monthlyEmi, 0);

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "all") return data.transactions;
    return data.transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [data.transactions, selectedMonth]);

  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === "all") return "All Time";
    const [y, m] = selectedMonth.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, [selectedMonth]);

  const income = useMemo(() => filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [filteredTransactions]);
  const expenses = useMemo(() => filteredTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filteredTransactions]);
  const savings = income - expenses;
  const rate = income ? Math.round((savings / income) * 100) : 0;

  const assets = data.assets.reduce((s, a) => s + a.value, 0) + data.investments.reduce((s, i) => s + i.current, 0);
  const liabilities = data.liabilities.reduce((s, l) => s + l.amount, 0);
  const net = assets - liabilities;

  const chart = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 15);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inc = data.transactions.filter(t => t.type === "income" && t.date.startsWith(ym)).reduce((s, t) => s + t.amount, 0);
      const exp = data.transactions.filter(t => t.type === "expense" && t.date.startsWith(ym)).reduce((s, t) => s + t.amount, 0);
      return {
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        income: inc,
        expenses: exp,
      };
    });
  }, [data.transactions]);

  const byCat = useMemo(() => {
    return Object.entries(
      filteredTransactions
        .filter(t => t.type === "expense")
        .reduce<Record<string, number>>((a, t) => {
          a[t.category] = (a[t.category] || 0) + t.amount;
          return a;
        }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredTransactions]);

  return (
    <div className={pageClass}>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Financial cockpit</p>
          <h1 className="text-3xl font-semibold">Finance</h1>
          <p className="mt-1 text-sm text-zinc-500">Cash flow, wealth and spending — connected.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <MonthSelect
            value={selectedMonth}
            onChange={setSelectedMonth}
            transactions={data.transactions}
          />
          <Button variant="ghost" onClick={() => navigate("/finance-calendar")}>
            <CalendarDays size={14} className="mr-2 inline" />Spending Calendar
          </Button>
          <Button variant="ghost" onClick={() => navigate("/transactions")}>
            <Receipt size={14} className="mr-2 inline" />Manage transactions
          </Button>
          <Button 
            className="bg-[#2563FF]/15 text-[#60A5FA] border border-[#2563FF]/30 hover:bg-[#2563FF]/25" 
            onClick={handleExportExcel}
            disabled={exportingExcel}
          >
            <FileSpreadsheet size={14} className="mr-2 inline" />
            {exportingExcel ? "Exporting..." : "Export Statement (.xlsx)"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={<ArrowUpRight size={17} />}
          label="Income"
          value={formatMoney(income)}
          detail={selectedMonth !== "all" ? selectedMonthLabel : undefined}
        />
        <Metric
          icon={<ArrowDownRight size={17} />}
          label="Expenses"
          value={formatMoney(expenses)}
          detail={selectedMonth !== "all" ? selectedMonthLabel : undefined}
        />
        <Metric
          icon={<PiggyBank size={17} />}
          label="Savings"
          value={formatMoney(savings)}
          detail={`${privacyMode ? "••%" : `${rate}%`} savings rate${selectedMonth !== "all" ? ` · ${selectedMonthLabel}` : ""}`}
        />
        <Metric
          icon={<Wallet size={17} />}
          label="Net worth"
          value={formatMoney(net)}
          detail="Total portfolio"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
        <LiquidCard className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Cash flow trend</p>
              <p className="mt-0.5 text-xs text-zinc-500">6-month income versus expenses</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#2563FF] shadow-[0_0_8px_rgba(37,99,255,0.8)]" />
                  <span className="text-zinc-300 font-medium">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/70" />
                  <span className="text-zinc-400 font-medium">Expenses</span>
                </div>
              </div>
              {selectedMonth !== "all" && (
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-400">
                  {selectedMonthLabel}
                </span>
              )}
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="incomeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563FF" stopOpacity={0.32} />
                    <stop offset="65%" stopColor="#1D4ED8" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="#2563FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expensesGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#71717a", fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 18, 34, 0.95)",
                    border: "1px solid #1C2940",
                    borderRadius: "16px",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(20px)",
                    fontSize: 12,
                  }}
                  formatter={(value: any, name: any) => [
                    formatMoney(Number(value) || 0),
                    name === "income" ? "Income" : "Expenses",
                  ]}
                  labelStyle={{ color: "#a1a1aa", fontWeight: 600, marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#2563FF"
                  fill="url(#incomeGlow)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#ffffff", stroke: "#2563FF", strokeWidth: 2.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="rgba(255, 255, 255, 0.65)"
                  fill="url(#expensesGlow)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4.5, fill: "#ffffff", stroke: "#a1a1aa", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </LiquidCard>

        <LiquidCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Spending mix</p>
              <p className="mt-1 text-xs text-zinc-600">
                Where expenses go {selectedMonth !== "all" ? `(${selectedMonthLabel})` : "(all time)"}
              </p>
            </div>
            {selectedMonth !== "all" && (
              <button
                onClick={() => setSelectedMonth("all")}
                className="text-[10px] text-zinc-500 underline underline-offset-2 hover:text-white"
              >
                Reset to all
              </button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {byCat.map(([name, value]) => (
              <div key={name}>
                <div className="mb-1.5 flex justify-between text-[10px]">
                  <span className="text-zinc-400">{name}</span>
                  <span>{formatMoney(value)}</span>
                </div>
                <ProgressBar value={expenses ? (value / expenses) * 100 : 0} />
              </div>
            ))}
            {!byCat.length && (
              <p className="py-8 text-center text-xs text-zinc-600">
                No expenses recorded {selectedMonth !== "all" ? `for ${selectedMonthLabel}` : ""}.
              </p>
            )}
          </div>
        </LiquidCard>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Quick title="EMIs & Loans" value={`${formatMoney(emiMonthly)} / mo`} icon={<CreditCard size={17} />} onClick={() => navigate("/emi")} />
        <Quick title="Budget" value={`${data.budgets.length} categories`} icon={<PiggyBank size={17} />} onClick={() => navigate("/budget")} />
        <Quick title="Investments" value={formatMoney(data.investments.reduce((s, i) => s + i.current, 0))} icon={<TrendingUp size={17} />} onClick={() => navigate("/investments")} />
        <Quick title="Goals" value={`${data.savingsGoals.length} savings goals`} icon={<Target size={17} />} onClick={() => navigate("/budget")} />
      </div>
    </div>
  );
}

function Quick({ title, value, icon, onClick }: { title: string; value: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="liquid-card flex items-center gap-3 p-5 text-left transition hover:-translate-y-0.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-zinc-500">{title}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
      <ArrowUpRight size={14} className="text-zinc-600" />
    </button>
  );
}

export default Finance;
