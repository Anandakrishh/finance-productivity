import { useMemo, useState } from "react";
import { Check, Circle, Plus, Search, Trash2, Pencil, CalendarDays, Clock3, X } from "lucide-react";
import { useAppData, type AppTask, type Priority } from "../context/AppDataContext";
import { Button, Field, Input, LiquidCard, Modal, Select, pageClass, getLocalDateString } from "../components/AppUI";

const categories = ["Career", "Learning", "Finance", "Health", "Personal"];
const priorities: Priority[] = ["Low", "Medium", "High"];

function Tasks() {
  const { data, setTasks } = useAppData();
  const [view, setView] = useState<"Today" | "Upcoming" | "All" | "Completed">("Today");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AppTask | null>(null);
  const [show, setShow] = useState(false);

  const today = getLocalDateString();
  const [form, setForm] = useState({
    title: "",
    category: "Personal",
    priority: "Medium" as Priority,
    date: today,
    time: "09:00",
  });

  const filtered = useMemo(() => data.tasks.filter(t => {
    const matches = t.title.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase());
    const status = view === "Today"
      ? (t.date === today || (!t.completed && t.date <= today))
      : view === "Upcoming"
      ? (t.date >= today)
      : view === "Completed"
      ? t.completed
      : true;
    return matches && status;
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [data.tasks, query, view, today]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", category: "Personal", priority: "Medium", date: today, time: "09:00" });
    setShow(true);
  };

  const openEdit = (t: AppTask) => {
    setEditing(t);
    setForm({ title: t.title, category: t.category, priority: t.priority, date: t.date || today, time: t.time || "09:00" });
    setShow(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (editing) {
      setTasks(list => list.map(t => (t.id === editing.id ? { ...t, ...form } : t)));
    } else {
      setTasks(list => [...list, { ...form, id: Date.now(), completed: false }]);
    }
    setShow(false);
  };

  const toggle = (id: number) => setTasks(list => list.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const remove = (id: number) => setTasks(list => list.filter(t => t.id !== id));

  return (
    <div className={pageClass}>
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Execution</p>
          <h1 className="text-3xl font-semibold">Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500">Turn intentions into clear next actions.</p>
        </div>
        <Button onClick={openNew}><Plus size={14} className="mr-2 inline" />New task</Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["Today", "Upcoming", "All", "Completed"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-2xl border p-4 text-left transition ${
              view === v ? "border-white/[.12] bg-white/[.06]" : "border-white/[.06] bg-white/[.02] hover:bg-white/[.04]"
            }`}
          >
            <p className="text-[10px] text-zinc-500">{v}</p>
            <p className="mt-1 text-xl font-semibold">
              {v === "Today"
                ? data.tasks.filter(t => t.date === today || (!t.completed && t.date <= today)).length
                : v === "Completed"
                ? data.tasks.filter(t => t.completed).length
                : v === "Upcoming"
                ? data.tasks.filter(t => t.date >= today && !t.completed).length
                : data.tasks.length}
            </p>
          </button>
        ))}
      </div>

      <LiquidCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-zinc-600" size={15} />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks..." className="pl-9" />
          </div>
        </div>
        <div className="divide-y divide-white/[.05]">
          {filtered.length ? (
            filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-4 transition hover:bg-white/[.02]">
                <button type="button" onClick={() => toggle(t.id)} className="shrink-0 p-1">
                  {t.completed ? <Check className="text-emerald-300" size={19} /> : <Circle className="text-zinc-700" size={19} />}
                </button>
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => openEdit(t)}>
                  <p className={`text-sm ${t.completed ? "text-zinc-600 line-through" : "text-zinc-300 hover:text-white"}`}>
                    {t.title}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-zinc-500">
                    <span>{t.category}</span>
                    <span>{t.priority}</span>
                    <span><CalendarDays size={10} className="mr-1 inline" />{t.date}</span>
                    <span><Clock3 size={10} className="mr-1 inline" />{t.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.08] hover:text-white transition"
                    title="Edit task"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(t.id); }}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/15 hover:text-red-300 transition"
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-zinc-500">No tasks in this view.</div>
          )}
        </div>
      </LiquidCard>

      <Modal open={show} title={editing ? "Edit task" : "Create task"} onClose={() => setShow(false)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to happen?" />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>
              {priorities.map(p => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Time">
            <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </Field>
          <Field label="Date">
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          {editing ? (
            <Button
              variant="danger"
              onClick={() => {
                remove(editing.id);
                setShow(false);
              }}
            >
              <Trash2 size={13} className="mr-1.5 inline" />Delete
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShow(false)}>
              <X size={14} className="mr-1.5 inline" />Cancel
            </Button>
            <Button onClick={save}>
              {editing ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Tasks;
