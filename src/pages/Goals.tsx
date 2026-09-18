import { useState, useMemo } from "react";
import { Plus, Target, Pencil, Trash2, CalendarDays, Flame } from "lucide-react";
import { useAppData, type AppGoal, type GoalStatus } from "../context/AppDataContext";
import { Button, Field, Input, LiquidCard, Modal, ProgressBar, Select, pageClass } from "../components/AppUI";

const categories = ["Career", "Finance", "Health", "Learning", "Personal"];
const statuses: GoalStatus[] = ["On track", "At risk", "Completed"];
const timeframes = ["All", "3 Months", "6 Months", "1 Year"] as const;
type Timeframe = typeof timeframes[number];

function Goals() {
  const { data, setGoals } = useAppData();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<AppGoal | null>(null);
  const [timeframeFilter, setTimeframeFilter] = useState<Timeframe>("All");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Career",
    progress: 0,
    targetDate: "2026-12-31",
    status: "On track" as GoalStatus,
    timeframe: "3 Months",
  });

  const getTimeframe = (targetDate: string): "3 Months" | "6 Months" | "1 Year" => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 100) return "3 Months";
    if (diffDays <= 200) return "6 Months";
    return "1 Year";
  };

  const filteredGoals = useMemo(() => {
    if (timeframeFilter === "All") return data.goals;
    return data.goals.filter(g => getTimeframe(g.targetDate) === timeframeFilter);
  }, [data.goals, timeframeFilter]);

  const openNew = () => {
    setEditing(null);
    const d3m = new Date();
    d3m.setMonth(d3m.getMonth() + 3);
    setForm({
      title: "",
      description: "",
      category: "Career",
      progress: 0,
      targetDate: d3m.toISOString().slice(0, 10),
      status: "On track",
      timeframe: "3 Months",
    });
    setShow(true);
  };

  const edit = (g: AppGoal) => {
    setEditing(g);
    setForm({
      title: g.title,
      description: g.description,
      category: g.category,
      progress: g.progress,
      targetDate: g.targetDate,
      status: g.status,
      timeframe: getTimeframe(g.targetDate),
    });
    setShow(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      progress: Number(form.progress),
      targetDate: form.targetDate,
      status: form.status,
      milestones: editing?.milestones ?? 5,
      completedMilestones: Math.round((Number(form.progress) / 100) * (editing?.milestones ?? 5)),
    };
    if (editing) {
      setGoals(list => list.map(g => (g.id === editing.id ? { ...g, ...payload } : g)));
    } else {
      setGoals(list => [...list, { ...payload, id: Date.now() }]);
    }
    setShow(false);
  };

  return (
    <div className={pageClass}>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-orange-400">Ambition & Direction</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Goals</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Structured for 3 Months, 6 Months & 1 Year — tracking momentum from daily habits.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Pills */}
          <div className="flex items-center gap-1 rounded-full border border-white/[0.16] bg-white/[0.07] p-1.5 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframeFilter(tf)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-all duration-200 ${
                  timeframeFilter === tf
                    ? "bg-white text-zinc-950 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)]"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.1] active:scale-95"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <Button onClick={openNew}>
            <Plus size={14} className="mr-2 inline" />New goal
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active Targets" value={data.goals.filter(g => g.progress < 100).length} />
        <Stat
          label="Avg Progress"
          value={`${data.goals.length ? Math.round(data.goals.reduce((s, g) => s + g.progress, 0) / data.goals.length) : 0}%`}
        />
        <Stat label="Completed" value={data.goals.filter(g => g.progress >= 100).length} />
        <Stat label="At Risk" value={data.goals.filter(g => g.status === "At risk").length} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredGoals.map(g => {
          const tf = getTimeframe(g.targetDate);
          return (
            <LiquidCard key={g.id} hover className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300 border border-orange-500/20">
                    <Target size={19} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{g.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[9px] font-semibold text-zinc-300">
                        {g.category}
                      </span>
                      <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold text-orange-300 border border-orange-500/20">
                        {tf}
                      </span>
                      <span
                        className={`text-[9px] font-semibold ${
                          g.status === "Completed"
                            ? "text-emerald-400"
                            : g.status === "At risk"
                            ? "text-red-400"
                            : "text-zinc-400"
                        }`}
                      >
                        · {g.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button onClick={() => edit(g)} className="p-2 text-zinc-500 hover:text-white transition">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setGoals(list => list.filter(x => x.id !== g.id))}
                    className="p-2 text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p className="my-4 text-xs leading-relaxed text-zinc-400">{g.description}</p>

              <div className="mb-2 flex justify-between text-[10px]">
                <span className="text-zinc-500">Progress</span>
                <span className="font-semibold text-white">{g.progress}%</span>
              </div>
              <ProgressBar value={g.progress} />

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={12} className="text-orange-400" />
                  <span>Target: {g.targetDate}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Flame size={12} className="text-amber-400" />
                  <span>Habit momentum active</span>
                </span>
              </div>
            </LiquidCard>
          );
        })}

        {!filteredGoals.length && (
          <div className="col-span-full rounded-3xl border border-dashed border-white/[0.08] p-12 text-center text-xs text-zinc-500">
            No goals found for timeframe: {timeframeFilter}. Click "New goal" to create one.
          </div>
        )}
      </div>

      <Modal open={show} title={editing ? "Edit Goal" : "Create Goal"} onClose={() => setShow(false)}>
        <div className="grid gap-4">
          <Field label="Goal Title">
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Launch new product, run 10k, save ₹2L..." />
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Why does this goal matter and what is the outcome?" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as GoalStatus })}>
                {statuses.map(s => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Progress %">
              <Input type="number" min="0" max="100" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
            </Field>
            <Field label="Target Date">
              <Input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={save}>{editing ? "Save changes" : "Create goal"}</Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <LiquidCard className="p-4">
      <p className="text-[10px] text-zinc-500 font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-white">{value}</p>
    </LiquidCard>
  );
}

export default Goals;

