import { useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Landmark,
  Calendar,
  Check,
  Undo2,
  Sparkles,
} from "lucide-react";
import { useAppData, type AppEmi } from "../context/AppDataContext";
import {
  Button,
  Field,
  IconButton,
  Input,
  LiquidCard,
  Modal,
  ProgressBar,
  Select,
  formatMoney,
  pageClass,
} from "../components/AppUI";

const CATEGORIES = [
  "Electronics",
  "Vehicle",
  "Housing",
  "Personal",
  "Education",
  "Credit Card",
  "Other",
];

export default function EMI() {
  const { data, setEmis, setTransactions } = useAppData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmi, setEditingEmi] = useState<AppEmi | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    category: "Electronics",
    lender: "",
    monthlyEmi: "",
    totalTenureMonths: "12",
    paidMonths: "0",
    totalAmount: "",
    interestRate: "0",
    dueDay: "5",
    startDate: new Date().toISOString().slice(0, 10),
    autoDebitAccount: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const openAddModal = () => {
    setEditingEmi(null);
    setForm({
      name: "",
      category: "Electronics",
      lender: "",
      monthlyEmi: "",
      totalTenureMonths: "12",
      paidMonths: "0",
      totalAmount: "",
      interestRate: "0",
      dueDay: "5",
      startDate: new Date().toISOString().slice(0, 10),
      autoDebitAccount: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (emi: AppEmi) => {
    setEditingEmi(emi);
    setForm({
      name: emi.name,
      category: emi.category,
      lender: emi.lender,
      monthlyEmi: String(emi.monthlyEmi),
      totalTenureMonths: String(emi.totalTenureMonths),
      paidMonths: String(emi.paidMonths),
      totalAmount: String(emi.totalAmount),
      interestRate: String(emi.interestRate),
      dueDay: String(emi.dueDay),
      startDate: emi.startDate || new Date().toISOString().slice(0, 10),
      autoDebitAccount: emi.autoDebitAccount || "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.monthlyEmi) return;

    const monthlyEmi = Number(form.monthlyEmi) || 0;
    const totalTenure = Math.max(1, Number(form.totalTenureMonths) || 12);
    const paidMonths = Math.min(totalTenure, Math.max(0, Number(form.paidMonths) || 0));
    const totalAmount = Number(form.totalAmount) || monthlyEmi * totalTenure;
    const dueDay = Math.min(31, Math.max(1, Number(form.dueDay) || 5));

    if (editingEmi) {
      setEmis((prev) =>
        prev.map((e) =>
          e.id === editingEmi.id
            ? {
                ...e,
                name: form.name.trim(),
                category: form.category,
                lender: form.lender.trim(),
                monthlyEmi,
                totalTenureMonths: totalTenure,
                paidMonths,
                totalAmount,
                interestRate: Number(form.interestRate) || 0,
                dueDay,
                startDate: form.startDate,
                autoDebitAccount: form.autoDebitAccount.trim() || undefined,
              }
            : e
        )
      );
      showToast(`Updated "${form.name.trim()}"`);
    } else {
      const newEmi: AppEmi = {
        id: Date.now(),
        name: form.name.trim(),
        category: form.category,
        lender: form.lender.trim(),
        monthlyEmi,
        totalTenureMonths: totalTenure,
        paidMonths,
        totalAmount,
        interestRate: Number(form.interestRate) || 0,
        dueDay,
        startDate: form.startDate,
        autoDebitAccount: form.autoDebitAccount.trim() || undefined,
      };
      setEmis((prev) => [...prev, newEmi]);
      showToast(`Added new EMI "${form.name.trim()}"`);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Remove EMI "${name}"? This will not delete past transactions.`)) {
      setEmis((prev) => prev.filter((e) => e.id !== id));
      showToast(`Removed "${name}"`);
    }
  };

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
  const currentDay = now.getDate();

  // Helper for EMI status
  const getEmiStatus = (emi: AppEmi) => {
    const isCompleted = emi.paidMonths >= emi.totalTenureMonths;
    if (isCompleted) {
      return { status: "completed", label: "Completed", color: "text-emerald-400" };
    }

    const paidThisMonth = emi.lastPaidDate?.startsWith(currentMonthKey);
    if (paidThisMonth) {
      return { status: "paid", label: "Paid this month ✓", color: "text-emerald-400" };
    }

    const daysDiff = emi.dueDay - currentDay;
    if (daysDiff < 0) {
      return {
        status: "overdue",
        label: `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? "" : "s"} ⚠️`,
        color: "text-red-400",
      };
    } else if (daysDiff === 0) {
      return { status: "today", label: "Due Today 🔔", color: "text-amber-300" };
    } else if (daysDiff <= 5) {
      return {
        status: "soon",
        label: `Due in ${daysDiff} day${daysDiff === 1 ? "" : "s"} (${emi.dueDay}th)`,
        color: "text-amber-200",
      };
    } else {
      return {
        status: "upcoming",
        label: `Due on ${emi.dueDay}th`,
        color: "text-zinc-400",
      };
    }
  };

  // Mark this month's installment as paid
  const handleMarkPaid = (emi: AppEmi) => {
    if (emi.paidMonths >= emi.totalTenureMonths) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const newPaidCount = emi.paidMonths + 1;

    setEmis((prev) =>
      prev.map((e) =>
        e.id === emi.id
          ? {
              ...e,
              paidMonths: newPaidCount,
              lastPaidDate: todayStr,
            }
          : e
      )
    );

    // Also record transaction in transactions page for financial cash flow accuracy
    setTransactions((prev) => [
      {
        id: Date.now(),
        description: `EMI Payment: ${emi.name} (${newPaidCount}/${emi.totalTenureMonths})`,
        title: `EMI Payment: ${emi.name}`,
        amount: emi.monthlyEmi,
        type: "expense",
        category: "Other",
        date: todayStr,
        account: emi.autoDebitAccount || "Bank Account",
      },
      ...prev,
    ]);

    showToast(`Marked ${emi.name} paid! Added to transactions.`);
  };

  // Undo payment
  const handleUndoPaid = (emi: AppEmi) => {
    if (emi.paidMonths <= 0) return;
    setEmis((prev) =>
      prev.map((e) =>
        e.id === emi.id
          ? {
              ...e,
              paidMonths: Math.max(0, e.paidMonths - 1),
              lastPaidDate: undefined,
            }
          : e
      )
    );
    showToast(`Undid payment for ${emi.name}`);
  };

  // Split active and completed
  const activeEmis = useMemo(
    () => data.emis.filter((e) => e.paidMonths < e.totalTenureMonths),
    [data.emis]
  );

  const completedEmis = useMemo(
    () => data.emis.filter((e) => e.paidMonths >= e.totalTenureMonths),
    [data.emis]
  );

  // Summary Metrics
  const totalMonthlyOutgo = activeEmis.reduce((sum, e) => sum + e.monthlyEmi, 0);

  const totalOutstandingDebt = activeEmis.reduce((sum, e) => {
    const remaining = (e.totalTenureMonths - e.paidMonths) * e.monthlyEmi;
    return sum + remaining;
  }, 0);

  const totalPaidSoFar = data.emis.reduce(
    (sum, e) => sum + e.paidMonths * e.monthlyEmi,
    0
  );

  // Urgent / Due soon items
  const dueSoonList = useMemo(() => {
    return activeEmis.filter((e) => {
      const isPaid = e.lastPaidDate?.startsWith(currentMonthKey);
      if (isPaid) return false;
      const diff = e.dueDay - currentDay;
      return diff <= 7; // due within 7 days or overdue
    }).sort((a, b) => a.dueDay - b.dueDay);
  }, [activeEmis, currentDay, currentMonthKey]);

  return (
    <div className={pageClass}>
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-white/[.15] bg-[#12141a]/95 px-5 py-3 text-xs font-medium text-white shadow-2xl backdrop-blur-xl">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">
            Repayments & Debt
          </p>
          <h1 className="text-3xl font-semibold">EMIs & Loans</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track installments, stay alert to due dates, and eliminate liabilities.
          </p>
        </div>

        <Button onClick={openAddModal}>
          <Plus size={14} className="mr-2 inline" /> Add EMI / Loan
        </Button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <LiquidCard className="p-4 sm:p-5">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400">
            <CreditCard size={17} />
          </div>
          <p className="text-[11px] text-zinc-500">Monthly EMI Outgo</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {formatMoney(totalMonthlyOutgo)}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            Across {activeEmis.length} active repayment{activeEmis.length === 1 ? "" : "s"}
          </p>
        </LiquidCard>

        <LiquidCard className="p-4 sm:p-5">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400">
            <Landmark size={17} />
          </div>
          <p className="text-[11px] text-zinc-500">Outstanding Debt</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {formatMoney(totalOutstandingDebt)}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            {formatMoney(totalPaidSoFar)} paid so far
          </p>
        </LiquidCard>

        <LiquidCard className="p-4 sm:p-5">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400">
            <Calendar size={17} />
          </div>
          <p className="text-[11px] text-zinc-500">Next Repayment Due</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {dueSoonList.length > 0
              ? `${dueSoonList[0].dueDay}th of month`
              : activeEmis.length > 0
                ? "All paid this month ✓"
                : "No active EMIs"}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            {dueSoonList.length > 0 ? dueSoonList[0].name : "Peace of mind"}
          </p>
        </LiquidCard>

        <LiquidCard className="p-4 sm:p-5">
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.055] text-zinc-400">
            <CheckCircle2 size={17} />
          </div>
          <p className="text-[11px] text-zinc-500">Loans Closed</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {completedEmis.length}
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">
            {data.emis.length} total tracked
          </p>
        </LiquidCard>
      </div>

      {/* Due Soon / Action Required Banner */}
      {dueSoonList.length > 0 && (
        <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-200">
                  {dueSoonList.length} installment{dueSoonList.length === 1 ? "" : "s"} due soon
                </h3>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Total of {formatMoney(dueSoonList.reduce((s, e) => s + e.monthlyEmi, 0))} due for payment. Ensure sufficient bank balance for auto-debit.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {dueSoonList.map((emi) => (
                <button
                  key={emi.id}
                  onClick={() => handleMarkPaid(emi)}
                  className="flex items-center gap-2 rounded-xl border border-white/[.12] bg-white/[.08] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-black"
                >
                  <Check size={13} />
                  Pay {emi.name} ({formatMoney(emi.monthlyEmi)})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-7 flex items-center gap-2 border-b border-white/[.06] pb-3">
        <button
          onClick={() => setActiveTab("active")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
            activeTab === "active"
              ? "bg-white/[.08] text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Active EMIs ({activeEmis.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
            activeTab === "completed"
              ? "bg-white/[.08] text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Completed & Closed ({completedEmis.length})
        </button>
      </div>

      {/* EMI Cards List */}
      <div className="mt-5 space-y-4">
        {activeTab === "active" && activeEmis.length === 0 && (
          <LiquidCard className="p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[.04] text-zinc-500">
              <Sparkles size={20} />
            </div>
            <p className="text-sm font-medium">No active EMIs or loans</p>
            <p className="mt-1 text-xs text-zinc-500">
              You are currently debt-free, or haven't added any ongoing EMIs yet.
            </p>
            <div className="mt-5">
              <Button onClick={openAddModal}>
                <Plus size={14} className="mr-2 inline" /> Add an EMI
              </Button>
            </div>
          </LiquidCard>
        )}

        {activeTab === "completed" && completedEmis.length === 0 && (
          <LiquidCard className="p-12 text-center">
            <p className="text-sm font-medium">No completed loans yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              When an EMI tenure is fully paid off, it will appear here as a milestone.
            </p>
          </LiquidCard>
        )}

        {(activeTab === "active" ? activeEmis : completedEmis).map((emi) => {
          const statusInfo = getEmiStatus(emi);
          const percent = Math.min(
            100,
            Math.round((emi.paidMonths / emi.totalTenureMonths) * 100)
          );
          const remainingAmount =
            (emi.totalTenureMonths - emi.paidMonths) * emi.monthlyEmi;
          const paidThisMonth = emi.lastPaidDate?.startsWith(currentMonthKey);

          return (
            <LiquidCard key={emi.id} className="p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                {/* Left side: title and details */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{emi.name}</h3>
                    <span className="rounded-lg border border-white/[.08] bg-white/[.03] px-2 py-0.5 text-[10px] text-zinc-400">
                      {emi.category}
                    </span>
                    {emi.lender && (
                      <span className="flex items-center gap-1 rounded-lg border border-white/[.08] bg-white/[.03] px-2 py-0.5 text-[10px] text-zinc-400">
                        <Landmark size={10} /> {emi.lender}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${statusInfo.color}`}>
                      • {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <div>
                      <span className="text-zinc-600">Monthly: </span>
                      <span className="font-medium text-white">
                        {formatMoney(emi.monthlyEmi)}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-600">Due Date: </span>
                      <span>{emi.dueDay}th of each month</span>
                    </div>

                    {emi.interestRate > 0 ? (
                      <div>
                        <span className="text-zinc-600">Interest: </span>
                        <span>{emi.interestRate}% p.a.</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-emerald-400">0% No-Cost EMI</span>
                      </div>
                    )}

                    {emi.autoDebitAccount && (
                      <div>
                        <span className="text-zinc-600">Auto-debit: </span>
                        <span>{emi.autoDebitAccount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: quick actions */}
                <div className="flex items-center gap-2">
                  {emi.paidMonths < emi.totalTenureMonths ? (
                    paidThisMonth ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                          <Check size={13} className="mr-1.5 inline" /> Paid this month
                        </span>
                        <IconButton
                          label="Undo payment"
                          onClick={() => handleUndoPaid(emi)}
                        >
                          <Undo2 size={14} />
                        </IconButton>
                      </div>
                    ) : (
                      <Button onClick={() => handleMarkPaid(emi)}>
                        <Check size={14} className="mr-2 inline" /> Mark Month Paid
                      </Button>
                    )
                  ) : (
                    <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                      🎉 100% Repaid
                    </span>
                  )}

                  <IconButton label="Edit" onClick={() => openEditModal(emi)}>
                    <Edit2 size={14} />
                  </IconButton>

                  <IconButton
                    label="Delete"
                    onClick={() => handleDelete(emi.id, emi.name)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </div>

              {/* Progress bar and metrics */}
              <div className="mt-5 space-y-2 border-t border-white/[.05] pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">
                    <span className="font-semibold text-white">
                      {emi.paidMonths}
                    </span>{" "}
                    of {emi.totalTenureMonths} installments paid ({percent}%)
                  </span>
                  <span className="text-zinc-500">
                    Remaining:{" "}
                    <span className="font-medium text-zinc-300">
                      {formatMoney(remainingAmount)}
                    </span>
                  </span>
                </div>

                <ProgressBar value={percent} />

                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>
                    Paid: {formatMoney(emi.paidMonths * emi.monthlyEmi)}
                  </span>
                  <span>Total Loan: {formatMoney(emi.totalAmount)}</span>
                </div>
              </div>
            </LiquidCard>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editingEmi ? "Edit EMI / Loan" : "Add EMI / Loan"}
        onClose={() => setModalOpen(false)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Loan / Item Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. MacBook Pro, Car Loan"
              required
            />
          </Field>

          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Lender / Bank">
            <Input
              value={form.lender}
              onChange={(e) => setForm({ ...form, lender: e.target.value })}
              placeholder="e.g. HDFC Bank, Apple"
            />
          </Field>

          <Field label="Monthly EMI Amount (₹)">
            <Input
              type="number"
              value={form.monthlyEmi}
              onChange={(e) => setForm({ ...form, monthlyEmi: e.target.value })}
              placeholder="e.g. 5000"
              required
            />
          </Field>

          <Field label="Total Tenure (Months)">
            <Input
              type="number"
              value={form.totalTenureMonths}
              onChange={(e) =>
                setForm({ ...form, totalTenureMonths: e.target.value })
              }
              placeholder="12"
            />
          </Field>

          <Field label="Installments Already Paid">
            <Input
              type="number"
              value={form.paidMonths}
              onChange={(e) => setForm({ ...form, paidMonths: e.target.value })}
              placeholder="0"
            />
          </Field>

          <Field label="Due Day of Month (1-31)">
            <Input
              type="number"
              min="1"
              max="31"
              value={form.dueDay}
              onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
              placeholder="5"
            />
          </Field>

          <Field label="Interest Rate (% p.a.)">
            <Input
              type="number"
              step="0.1"
              value={form.interestRate}
              onChange={(e) =>
                setForm({ ...form, interestRate: e.target.value })
              }
              placeholder="0 for no-cost"
            />
          </Field>

          <Field label="Auto-debit Account">
            <Input
              value={form.autoDebitAccount}
              onChange={(e) =>
                setForm({ ...form, autoDebitAccount: e.target.value })
              }
              placeholder="e.g. HDFC Salary, SBI"
            />
          </Field>

          <Field label="Start Date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editingEmi ? "Save Changes" : "Create EMI"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
