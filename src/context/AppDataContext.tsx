import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";

export type Priority = "Low" | "Medium" | "High";
export type GoalStatus = "On track" | "At risk" | "Completed";
export type Frequency = "Daily" | "Weekdays" | "Weekly";
export type TransactionType = "income" | "expense";
export type InvestmentType = "Stock" | "Mutual Fund" | "ETF" | "Gold" | "FD";

export type AppTask = {
  id: number;
  title: string;
  category: string;
  priority: Priority;
  date: string;
  time: string;
  completed: boolean;
};

export type AppGoal = {
  id: number;
  title: string;
  description: string;
  category: string;
  progress: number;
  targetDate: string;
  status: GoalStatus;
  milestones: number;
  completedMilestones: number;
};

export type AppHabit = {
  id: number;
  name: string;
  category: string;
  frequency: Frequency;
  streak: number;
  bestStreak: number;
  completedDates: string[];
};

export type AppTransaction = {
  id: number;
  description: string;
  title?: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  account?: string;
};

export type AppAsset = {
  id: number;
  name: string;
  type: string;
  value: number;
  updatedAt?: string;
};

export type AppLiability = {
  id: number;
  name: string;
  type: string;
  amount: number;
  updatedAt?: string;
};

export type AppBudget = {
  id: number;
  name: string;
  limit: number;
};

export type AppSavingsGoal = {
  id: number;
  name: string;
  target: number;
  saved: number;
  deadline: string;
};

export type AppInvestment = {
  id: number;
  name: string;
  symbol: string;
  type: InvestmentType;
  invested: number;
  current: number;
  units: number;
  date?: string;
};

export type AppCalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: string;
  location?: string;
  description?: string;
};

export type AppEmi = {
  id: number;
  name: string;
  category: string;
  lender: string;
  monthlyEmi: number;
  totalTenureMonths: number;
  paidMonths: number;
  totalAmount: number;
  interestRate: number;
  dueDay: number;
  startDate?: string;
  autoDebitAccount?: string;
  lastPaidDate?: string;
};

export type AppData = {
  tasks: AppTask[];
  goals: AppGoal[];
  habits: AppHabit[];
  transactions: AppTransaction[];
  assets: AppAsset[];
  liabilities: AppLiability[];
  budgets: AppBudget[];
  savingsGoals: AppSavingsGoal[];
  investments: AppInvestment[];
  calendarEvents: AppCalendarEvent[];
  emis: AppEmi[];
};

type AppDataContextType = {
  data: AppData;
  loading: boolean;
  setTasks: React.Dispatch<React.SetStateAction<AppTask[]>>;
  setGoals: React.Dispatch<React.SetStateAction<AppGoal[]>>;
  setHabits: React.Dispatch<React.SetStateAction<AppHabit[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<AppTransaction[]>>;
  setAssets: React.Dispatch<React.SetStateAction<AppAsset[]>>;
  setLiabilities: React.Dispatch<React.SetStateAction<AppLiability[]>>;
  setBudgets: React.Dispatch<React.SetStateAction<AppBudget[]>>;
  setSavingsGoals: React.Dispatch<React.SetStateAction<AppSavingsGoal[]>>;
  setInvestments: React.Dispatch<React.SetStateAction<AppInvestment[]>>;
  setCalendarEvents: React.Dispatch<React.SetStateAction<AppCalendarEvent[]>>;
  setEmis: React.Dispatch<React.SetStateAction<AppEmi[]>>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapTask(row: any): AppTask {
  return {
    id: Number(row.id),
    title: row.title ?? "",
    category: row.category ?? "Personal",
    priority: row.priority ?? "Medium",
    date: row.date ?? "",
    time: row.time ?? "",
    completed: Boolean(row.completed),
  };
}

function mapGoal(row: any): AppGoal {
  return {
    id: Number(row.id),
    title: row.title ?? "",
    description: row.description ?? "",
    category: row.category ?? "Personal",
    progress: numberValue(row.progress),
    targetDate: row.target_date ?? "",
    status: row.status ?? "On track",
    milestones: numberValue(row.milestones),
    completedMilestones: numberValue(row.completed_milestones),
  };
}

function mapHabit(row: any): AppHabit {
  let completedDates: string[] = [];
  if (Array.isArray(row.completed_dates)) {
    completedDates = row.completed_dates;
  } else if (typeof row.completed_dates === "string") {
    try {
      completedDates = JSON.parse(row.completed_dates);
    } catch {
      completedDates = [];
    }
  }

  return {
    id: Number(row.id),
    name: row.name ?? "",
    category: row.category ?? "Personal",
    frequency: row.frequency ?? "Daily",
    streak: numberValue(row.streak),
    bestStreak: numberValue(row.best_streak),
    completedDates,
  };
}

function mapTransaction(row: any): AppTransaction {
  return {
    id: Number(row.id),
    description: row.description ?? row.title ?? "",
    title: row.title ?? row.description ?? "",
    amount: numberValue(row.amount),
    type: row.type === "income" ? "income" : "expense",
    category: row.category ?? "Other",
    date: row.date ?? "",
    account: row.account ?? undefined,
  };
}

function mapAsset(row: any): AppAsset {
  return {
    id: Number(row.id),
    name: row.name ?? "",
    type: row.type ?? "Other",
    value: numberValue(row.value),
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapLiability(row: any): AppLiability {
  return {
    id: Number(row.id),
    name: row.name ?? "",
    type: row.type ?? "Other",
    amount: numberValue(row.amount),
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapBudget(row: any): AppBudget {
  return {
    id: Number(row.id),
    name: row.name ?? "",
    limit: numberValue(row.limit),
  };
}

function mapSavingsGoal(row: any): AppSavingsGoal {
  return {
    id: Number(row.id),
    name: row.name ?? "",
    target: numberValue(row.target),
    saved: numberValue(row.saved),
    deadline: row.deadline ?? "",
  };
}

function mapInvestment(row: any): AppInvestment {
  return {
    id: Number(row.id),
    name: row.name ?? "",
    symbol: row.symbol ?? "",
    type: row.type ?? "Stock",
    invested: numberValue(row.invested),
    current: numberValue(row.current),
    units: numberValue(row.units),
    date: row.date ?? undefined,
  };
}

function mapCalendarEvent(row: any): AppCalendarEvent {
  return {
    id: String(row.id),
    title: row.title ?? "",
    date: row.date ?? "",
    time: row.time ?? undefined,
    category: row.category ?? "Personal",
    location: row.location ?? undefined,
    description: row.description ?? undefined,
  };
}

function mapEmi(row: any): AppEmi {
  return {
    id: Number(row.id),
    name: row.name ?? "",
    category: row.category ?? "Other",
    lender: row.lender ?? "",
    monthlyEmi: numberValue(row.monthly_emi ?? row.monthlyEmi),
    totalTenureMonths: numberValue(row.total_tenure_months ?? row.totalTenureMonths) || 12,
    paidMonths: numberValue(row.paid_months ?? row.paidMonths),
    totalAmount: numberValue(row.total_amount ?? row.totalAmount),
    interestRate: numberValue(row.interest_rate ?? row.interestRate),
    dueDay: numberValue(row.due_day ?? row.dueDay) || 5,
    startDate: row.start_date ?? row.startDate ?? undefined,
    autoDebitAccount: row.auto_debit_account ?? row.autoDebitAccount ?? undefined,
    lastPaidDate: row.last_paid_date ?? row.lastPaidDate ?? undefined,
  };
}

async function fetchUserData(_userId: string): Promise<AppData> {
  const remote = await api.data.getAll();

  return {
    tasks: (remote.tasks ?? []).map(mapTask),
    goals: (remote.goals ?? []).map(mapGoal),
    habits: (remote.habits ?? []).map(mapHabit),
    transactions: (remote.transactions ?? []).map(mapTransaction),
    assets: (remote.assets ?? []).map(mapAsset),
    liabilities: (remote.liabilities ?? []).map(mapLiability),
    budgets: (remote.budgets ?? []).map(mapBudget),
    savingsGoals: (remote.savingsGoals ?? []).map(mapSavingsGoal),
    investments: (remote.investments ?? []).map(mapInvestment),
    calendarEvents: (remote.calendarEvents ?? []).map(mapCalendarEvent),
    emis: (remote.emis ?? []).map(mapEmi),
  };
}

function rowsForTasks(userId: string, items: AppTask[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    title: item.title,
    category: item.category,
    priority: item.priority,
    date: item.date,
    time: item.time,
    completed: item.completed,
  }));
}

function rowsForGoals(userId: string, items: AppGoal[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    title: item.title,
    description: item.description,
    category: item.category,
    progress: item.progress,
    target_date: item.targetDate,
    status: item.status,
    milestones: item.milestones,
    completed_milestones: item.completedMilestones,
  }));
}

function rowsForHabits(userId: string, items: AppHabit[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    category: item.category,
    frequency: item.frequency,
    streak: item.streak,
    best_streak: item.bestStreak,
    completed_dates: item.completedDates,
  }));
}

function rowsForTransactions(userId: string, items: AppTransaction[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    description: item.description,
    title: item.title ?? item.description,
    amount: item.amount,
    type: item.type,
    category: item.category,
    date: item.date,
    account: item.account ?? null,
  }));
}

function rowsForAssets(userId: string, items: AppAsset[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    type: item.type,
    value: item.value,
    updated_at: item.updatedAt ?? null,
  }));
}

function rowsForLiabilities(userId: string, items: AppLiability[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    type: item.type,
    amount: item.amount,
    updated_at: item.updatedAt ?? null,
  }));
}

function rowsForBudgets(userId: string, items: AppBudget[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    limit: item.limit,
  }));
}

function rowsForSavingsGoals(userId: string, items: AppSavingsGoal[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    target: item.target,
    saved: item.saved,
    deadline: item.deadline,
  }));
}

function rowsForInvestments(userId: string, items: AppInvestment[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    symbol: item.symbol,
    type: item.type,
    invested: item.invested,
    current: item.current,
    units: item.units,
    date: item.date ?? null,
  }));
}

function rowsForCalendarEvents(userId: string, items: AppCalendarEvent[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    title: item.title,
    date: item.date,
    time: item.time ?? null,
    category: item.category,
    location: item.location ?? null,
    description: item.description ?? null,
  }));
}

function rowsForEmis(userId: string, items: AppEmi[]) {
  return items.map((item) => ({
    id: item.id,
    user_id: userId,
    name: item.name,
    category: item.category,
    lender: item.lender,
    monthly_emi: item.monthlyEmi,
    total_tenure_months: item.totalTenureMonths,
    paid_months: item.paidMonths,
    total_amount: item.totalAmount,
    interest_rate: item.interestRate,
    due_day: item.dueDay,
    start_date: item.startDate ?? null,
    auto_debit_account: item.autoDebitAccount ?? null,
    last_paid_date: item.lastPaidDate ?? null,
  }));
}

async function replaceUserRows(
  table: string,
  _userId: string,
  rows: Record<string, unknown>[]
) {
  await api.data.replaceTable(table, rows);
}

export function AppDataProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const [tasks, setTasksState] = useState<AppTask[]>([]);
  const [goals, setGoalsState] = useState<AppGoal[]>([]);
  const [habits, setHabitsState] = useState<AppHabit[]>([]);
  const [transactions, setTransactionsState] = useState<AppTransaction[]>([]);
  const [assets, setAssetsState] = useState<AppAsset[]>([]);
  const [liabilities, setLiabilitiesState] = useState<AppLiability[]>([]);
  const [budgets, setBudgetsState] = useState<AppBudget[]>([]);
  const [savingsGoals, setSavingsGoalsState] = useState<AppSavingsGoal[]>([]);
  const [investments, setInvestmentsState] = useState<AppInvestment[]>([]);
  const [calendarEvents, setCalendarEventsState] = useState<AppCalendarEvent[]>([]);
  const [emis, setEmisState] = useState<AppEmi[]>([]);
  const [loading, setLoading] = useState(true);
  const hydrating = useRef(true);

  useEffect(() => {
    let cancelled = false;
    hydrating.current = true;

    async function load() {
      setLoading(true);

      try {
        const remote = await fetchUserData(userId);

        if (cancelled) return;

        setTasksState(remote.tasks);
        setGoalsState(remote.goals);
        setHabitsState(remote.habits);
        setTransactionsState(remote.transactions);
        setAssetsState(remote.assets);
        setLiabilitiesState(remote.liabilities);
        setBudgetsState(remote.budgets);
        setSavingsGoalsState(remote.savingsGoals);
        setInvestmentsState(remote.investments);
        setCalendarEventsState(remote.calendarEvents);
        setEmisState(remote.emis);
      } catch (error) {
        console.error("PULSE: failed to load user data", error);

        if (!cancelled) {
          setTasksState([]);
          setGoalsState([]);
          setHabitsState([]);
          setTransactionsState([]);
          setAssetsState([]);
          setLiabilitiesState([]);
          setBudgetsState([]);
          setSavingsGoalsState([]);
          setInvestmentsState([]);
          setCalendarEventsState([]);
          setEmisState([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Release the hydration guard only after the freshly loaded state has rendered.
  useEffect(() => {
    if (!loading) {
      hydrating.current = false;
    }
  }, [loading]);

  const setTasks: React.Dispatch<React.SetStateAction<AppTask[]>> = (action) => {
    setTasksState(action);
  };

  const setGoals: React.Dispatch<React.SetStateAction<AppGoal[]>> = (action) => {
    setGoalsState(action);
  };

  const setHabits: React.Dispatch<React.SetStateAction<AppHabit[]>> = (action) => {
    setHabitsState(action);
  };

  const setTransactions: React.Dispatch<React.SetStateAction<AppTransaction[]>> = (action) => {
    setTransactionsState(action);
  };

  const setAssets: React.Dispatch<React.SetStateAction<AppAsset[]>> = (action) => {
    setAssetsState(action);
  };

  const setLiabilities: React.Dispatch<React.SetStateAction<AppLiability[]>> = (action) => {
    setLiabilitiesState(action);
  };

  const setBudgets: React.Dispatch<React.SetStateAction<AppBudget[]>> = (action) => {
    setBudgetsState(action);
  };

  const setSavingsGoals: React.Dispatch<React.SetStateAction<AppSavingsGoal[]>> = (action) => {
    setSavingsGoalsState(action);
  };

  const setInvestments: React.Dispatch<React.SetStateAction<AppInvestment[]>> = (action) => {
    setInvestmentsState(action);
  };

  const setCalendarEvents: React.Dispatch<React.SetStateAction<AppCalendarEvent[]>> = (action) => {
    setCalendarEventsState(action);
  };

  const setEmis: React.Dispatch<React.SetStateAction<AppEmi[]>> = (action) => {
    setEmisState(action);
  };

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("tasks", userId, rowsForTasks(userId, tasks)).catch((error) =>
        console.error("PULSE: failed to save tasks", error)
      );
    }
  }, [userId, tasks]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("goals", userId, rowsForGoals(userId, goals)).catch((error) =>
        console.error("PULSE: failed to save goals", error)
      );
    }
  }, [userId, goals]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("habits", userId, rowsForHabits(userId, habits)).catch((error) =>
        console.error("PULSE: failed to save habits", error)
      );
    }
  }, [userId, habits]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("transactions", userId, rowsForTransactions(userId, transactions)).catch((error) =>
        console.error("PULSE: failed to save transactions", error)
      );
    }
  }, [userId, transactions]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("assets", userId, rowsForAssets(userId, assets)).catch((error) =>
        console.error("PULSE: failed to save assets", error)
      );
    }
  }, [userId, assets]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("liabilities", userId, rowsForLiabilities(userId, liabilities)).catch((error) =>
        console.error("PULSE: failed to save liabilities", error)
      );
    }
  }, [userId, liabilities]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("budgets", userId, rowsForBudgets(userId, budgets)).catch((error) =>
        console.error("PULSE: failed to save budgets", error)
      );
    }
  }, [userId, budgets]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("savings_goals", userId, rowsForSavingsGoals(userId, savingsGoals)).catch((error) =>
        console.error("PULSE: failed to save savings goals", error)
      );
    }
  }, [userId, savingsGoals]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("investments", userId, rowsForInvestments(userId, investments)).catch((error) =>
        console.error("PULSE: failed to save investments", error)
      );
    }
  }, [userId, investments]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("calendar_events", userId, rowsForCalendarEvents(userId, calendarEvents)).catch((error) =>
        console.error("PULSE: failed to save calendar events", error)
      );
    }
  }, [userId, calendarEvents]);

  useEffect(() => {
    if (!hydrating.current) {
      void replaceUserRows("emis", userId, rowsForEmis(userId, emis)).catch((error) =>
        console.error("PULSE: failed to save emis", error)
      );
    }
  }, [userId, emis]);

  const value: AppDataContextType = {
    data: {
      tasks,
      goals,
      habits,
      transactions,
      assets,
      liabilities,
      budgets,
      savingsGoals,
      investments,
      calendarEvents,
      emis,
    },
    loading,
    setTasks,
    setGoals,
    setHabits,
    setTransactions,
    setAssets,
    setLiabilities,
    setBudgets,
    setSavingsGoals,
    setInvestments,
    setCalendarEvents,
    setEmis,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}