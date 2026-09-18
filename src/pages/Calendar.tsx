import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Trash2, X, Clock } from "lucide-react";
import { useAppData, type AppCalendarEvent } from "../context/AppDataContext";
import { Button, Field, Input, LiquidCard, Modal, Select, pageClass, getLocalDateString } from "../components/AppUI";

const pad = (n: number) => String(n).padStart(2, "0");
const formatDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type ViewMode = "month" | "weekly" | "daily";
type TimelineFilter = "all" | "task" | "habit" | "event";

type TimelineItem = {
  id: string;
  type: "Task" | "Habit" | "Event";
  title: string;
  date: string;
  time?: string;
  detail?: string;
  completed?: boolean;
  color: string;
  rawId?: number | string;
};

const hours = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
];

function Calendar() {
  const { data, setCalendarEvents, setTasks } = useAppData();
  const now = new Date();
  const todayKey = getLocalDateString(now);

  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AppCalendarEvent | null>(null);

  const [form, setForm] = useState({
    title: "",
    date: formatDateKey(now),
    time: "10:00",
    category: "Personal",
    location: "",
    description: "",
  });

  // Calculate the 7 days of the current selected week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diffToMon = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.getFullYear(), current.getMonth(), diffToMon);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  // Calculate month matrix (7 columns, Monday to Sunday)
  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const days: { date: Date; isCurrentMonth: boolean; key: string }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        key: formatDateKey(d),
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        key: formatDateKey(d),
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        key: formatDateKey(d),
      });
    }

    return days;
  }, [selectedDate]);

  // Aggregate Tasks, Habits, and Events into a unified timeline
  const items = useMemo<TimelineItem[]>(() => {
    const out: TimelineItem[] = [];

    // 1. Tasks
    data.tasks.forEach(t => {
      if (t.date) {
        out.push({
          id: `task-${t.id}`,
          rawId: t.id,
          type: "Task",
          title: t.title,
          date: t.date,
          time: t.time || undefined,
          detail: t.category,
          completed: t.completed,
          color: t.completed
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 line-through opacity-70"
            : "border-sky-500/30 bg-sky-500/15 text-sky-200",
        });
      }
    });

    // 2. Habits (show for completed dates & today)
    data.habits.forEach(h => {
      (h.completedDates || []).forEach(dKey => {
        out.push({
          id: `habit-${h.id}-${dKey}`,
          rawId: h.id,
          type: "Habit",
          title: h.name,
          date: dKey,
          time: "09:00",
          detail: `${h.streak} streak`,
          completed: true,
          color: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
        });
      });
    });

    // 3. Custom Calendar Events
    data.calendarEvents.forEach(e => {
      out.push({
        id: e.id,
        rawId: e.id,
        type: "Event",
        title: e.title,
        date: e.date,
        time: e.time || "14:00",
        detail: e.category + (e.location ? ` · ${e.location}` : ""),
        color: "border-orange-500/30 bg-orange-500/15 text-orange-200",
      });
    });

    return out;
  }, [data]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "task") return items.filter(i => i.type === "Task");
    if (activeFilter === "habit") return items.filter(i => i.type === "Habit");
    return items.filter(i => i.type === "Event");
  }, [items, activeFilter]);

  const navigatePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === "weekly") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d);
  };

  const navigateNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === "weekly") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setSelectedDate(d);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const openNewEvent = () => {
    setEditing(null);
    setForm({
      title: "",
      date: formatDateKey(selectedDate),
      time: "10:00",
      category: "Personal",
      location: "",
      description: "",
    });
    setShowModal(true);
  };

  const editEvent = (e: AppCalendarEvent) => {
    setEditing(e);
    setForm({
      title: e.title,
      date: e.date,
      time: e.time || "10:00",
      category: e.category,
      location: e.location || "",
      description: e.description || "",
    });
    setShowModal(true);
  };

  const saveEvent = () => {
    if (!form.title.trim()) return;
    if (editing) {
      setCalendarEvents(l => l.map(e => (e.id === editing.id ? { ...e, ...form } : e)));
    } else {
      setCalendarEvents(l => [...l, { id: `event-${Date.now()}`, ...form }]);
    }
    setShowModal(false);
  };

  const deleteEvent = (id: string) => {
    setCalendarEvents(l => l.filter(e => e.id !== id));
    setShowModal(false);
  };

  const toggleTask = (taskId: number) => {
    setTasks(list => list.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  const headerLabel = useMemo(() => {
    if (viewMode === "month") {
      return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (viewMode === "weekly") {
      return `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, [viewMode, selectedDate, weekDays]);

  return (
    <div className={pageClass}>
      {/* Top Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-400">
            Productivity Timeline
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Calendar</h1>
          <p className="mt-1 text-xs text-zinc-400">
            One unified schedule for tasks, daily habits, and custom calendar events.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month / Week / Day Switcher */}
          <div className="flex items-center gap-1 rounded-full border border-white/[0.16] bg-white/[0.07] p-1.5 backdrop-blur-3xl shadow-[0_8px_30px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            {(["month", "weekly", "daily"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-3.5 py-1.5 text-xs capitalize transition-all duration-200 ${
                  viewMode === mode
                    ? "bg-white text-zinc-950 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)]"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.1] active:scale-95"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button onClick={openNewEvent}>
            <Plus size={14} className="mr-1.5 inline" />Add event
          </Button>
        </div>
      </div>

      {/* Date Navigation & Stream Filter Pills */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Date Stepper */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
          <button
            onClick={navigatePrev}
            className="p-1 text-zinc-400 hover:text-white transition"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            className="px-2 font-mono text-xs font-semibold text-white hover:text-orange-400 transition"
            title="Click to jump to today"
          >
            {headerLabel}
          </button>
          <button
            onClick={navigateNext}
            className="p-1 text-zinc-400 hover:text-white transition"
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Stream Filter Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "task", "habit", "event"] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all ${
                activeFilter === f
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  : "bg-white/[0.02] text-zinc-500 hover:text-zinc-300 border border-white/[0.04] hover:bg-white/[0.05]"
              }`}
            >
              {f === "all" ? "All streams" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar Card */}
      <LiquidCard className="overflow-hidden p-4 sm:p-6">
        {/* 1. MONTH VIEW */}
        {viewMode === "month" && (
          <div>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500 mb-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthDays.map(d => {
                const isSelected = formatDateKey(selectedDate) === d.key;
                const isToday = d.key === todayKey;
                const dayItems = filteredItems.filter(i => i.date === d.key);

                return (
                  <div
                    key={d.key}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setViewMode("daily");
                    }}
                    className={`group relative min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-orange-500/50 bg-orange-500/10 shadow-lg"
                        : d.isCurrentMonth
                        ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12]"
                        : "border-white/[0.02] bg-black/20 opacity-40 hover:opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/40"
                            : "text-zinc-300"
                        }`}
                      >
                        {d.date.getDate()}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[10px] font-semibold text-zinc-400">
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    {/* Day Preview Badges */}
                    <div className="mt-1 space-y-1 overflow-hidden">
                      {dayItems.slice(0, 2).map(item => (
                        <div
                          key={item.id}
                          className={`truncate rounded-lg px-1.5 py-0.5 text-[9px] font-medium ${item.color}`}
                        >
                          {item.title}
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <p className="text-[9px] text-zinc-500 font-medium pl-1">
                          +{dayItems.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. WEEKLY VIEW */}
        {viewMode === "weekly" && (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day Header Row */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-2 border-b border-white/[0.08] pb-3 text-center">
                <span className="text-[10px] text-zinc-500 font-mono">Time</span>
                {weekDays.map(d => {
                  const dayKey = formatDateKey(d);
                  const isToday = dayKey === todayKey;
                  return (
                    <div
                      key={dayKey}
                      className="flex flex-col items-center cursor-pointer hover:opacity-80 transition"
                      onClick={() => {
                        setSelectedDate(d);
                        setViewMode("daily");
                      }}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span
                        className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/40"
                            : "text-zinc-300"
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* All-Day / Untimed Section */}
              <div className="grid grid-cols-[70px_repeat(7,1fr)] gap-2 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500 pt-1">
                  Anytime
                </span>
                {weekDays.map(d => {
                  const dayKey = formatDateKey(d);
                  const untimed = filteredItems.filter(
                    i => i.date === dayKey && (!i.time || !hours.some(h => i.time?.startsWith(h.slice(0, 2))))
                  );

                  return (
                    <div key={dayKey} className="space-y-1 min-h-[32px]">
                      {untimed.map(item => (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-1.5 text-left transition hover:scale-[1.02] cursor-pointer ${item.color}`}
                          onClick={() => {
                            if (item.type === "Event") {
                              const ev = data.calendarEvents.find(e => e.id === item.rawId);
                              if (ev) editEvent(ev);
                            } else if (item.type === "Task" && typeof item.rawId === "number") {
                              toggleTask(item.rawId);
                            }
                          }}
                        >
                          <p className="truncate text-[11px] font-semibold leading-tight">{item.title}</p>
                          <span className="text-[9px] opacity-75">{item.type}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Hourly Grid Rows */}
              <div className="divide-y divide-white/[0.04] pt-2">
                {hours.map(hour => (
                  <div key={hour} className="grid grid-cols-[70px_repeat(7,1fr)] gap-2 py-2.5 min-h-[56px] items-start">
                    <span className="font-mono text-[10px] text-zinc-500 pt-0.5">{hour}</span>

                    {weekDays.map(d => {
                      const dayKey = formatDateKey(d);
                      const hourItems = filteredItems.filter(
                        i => i.date === dayKey && i.time?.startsWith(hour.slice(0, 2))
                      );

                      return (
                        <div key={dayKey} className="space-y-1.5 min-h-[38px]">
                          {hourItems.map(item => (
                            <div
                              key={item.id}
                              className={`group relative rounded-xl border p-2 text-left transition hover:scale-[1.02] cursor-pointer ${item.color}`}
                              onClick={() => {
                                if (item.type === "Event") {
                                  const ev = data.calendarEvents.find(e => e.id === item.rawId);
                                  if (ev) editEvent(ev);
                                } else if (item.type === "Task" && typeof item.rawId === "number") {
                                  toggleTask(item.rawId);
                                }
                              }}
                            >
                              <p className="truncate text-xs font-semibold leading-tight">{item.title}</p>
                              <div className="mt-1 flex items-center justify-between text-[9px] opacity-80">
                                <span>{item.time}</span>
                                <span>{item.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. DAILY VIEW */}
        {viewMode === "daily" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {filteredItems.filter(i => i.date === formatDateKey(selectedDate)).length} items scheduled for this day
                </p>
              </div>

              <button
                onClick={() => setViewMode("weekly")}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
              >
                Switch to Weekly
              </button>
            </div>

            {/* Day's Timeline List */}
            <div className="divide-y divide-white/[0.04]">
              {/* Untimed Items First */}
              {filteredItems
                .filter(i => i.date === formatDateKey(selectedDate) && (!i.time || !hours.some(h => i.time?.startsWith(h.slice(0, 2)))))
                .map(item => (
                  <div key={item.id} className="flex gap-4 py-3 items-center">
                    <span className="w-16 shrink-0 font-mono text-xs text-zinc-500">Anytime</span>
                    <div className="flex-1">
                      <div
                        onClick={() => {
                          if (item.type === "Event") {
                            const ev = data.calendarEvents.find(e => e.id === item.rawId);
                            if (ev) editEvent(ev);
                          } else if (item.type === "Task" && typeof item.rawId === "number") {
                            toggleTask(item.rawId);
                          }
                        }}
                        className={`rounded-2xl border p-3.5 transition hover:scale-[1.01] cursor-pointer flex items-center justify-between ${item.color}`}
                      >
                        <div className="flex items-center gap-3">
                          {item.type === "Task" && typeof item.rawId === "number" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (typeof item.rawId === "number") toggleTask(item.rawId);
                              }}
                            >
                              {item.completed ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Circle size={16} />}
                            </button>
                          )}
                          <div>
                            <p className="text-sm font-bold">{item.title}</p>
                            <p className="text-xs opacity-80 mt-0.5">{item.detail}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{item.type}</span>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Scheduled Hourly Items */}
              {hours.map(hour => {
                const dayKey = formatDateKey(selectedDate);
                const hourItems = filteredItems.filter(
                  i => i.date === dayKey && i.time?.startsWith(hour.slice(0, 2))
                );

                return (
                  <div key={hour} className="flex gap-4 py-3 min-h-[56px] items-start">
                    <span className="w-16 shrink-0 font-mono text-xs text-zinc-500 pt-1">{hour}</span>
                    <div className="flex-1 space-y-2">
                      {hourItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.type === "Event") {
                              const ev = data.calendarEvents.find(e => e.id === item.rawId);
                              if (ev) editEvent(ev);
                            } else if (item.type === "Task" && typeof item.rawId === "number") {
                              toggleTask(item.rawId);
                            }
                          }}
                          className={`rounded-2xl border p-3.5 transition hover:scale-[1.01] cursor-pointer flex items-center justify-between ${item.color}`}
                        >
                          <div className="flex items-center gap-3">
                            {item.type === "Task" && typeof item.rawId === "number" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (typeof item.rawId === "number") toggleTask(item.rawId);
                                }}
                              >
                                {item.completed ? <CheckCircle2 size={16} className="text-emerald-300" /> : <Circle size={16} />}
                              </button>
                            )}
                            <div>
                              <p className="text-sm font-bold">{item.title}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs opacity-80">
                                <Clock size={12} />
                                <span>{item.time}</span>
                                <span>· {item.detail}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider">{item.type}</span>
                        </div>
                      ))}
                      {!hourItems.length && (
                        <div className="h-4 border-b border-dashed border-white/[0.03]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </LiquidCard>

      {/* Add / Edit Event Modal */}
      <Modal open={showModal} title={editing ? "Edit Event" : "Add Calendar Event"} onClose={() => setShowModal(false)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Event Title">
            <Input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Meeting, workout, review..."
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {["Personal", "Work", "Finance", "Health", "Learning", "Career"].map(c => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={form.time}
              onChange={e => setForm({ ...form, time: e.target.value })}
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              placeholder="Office, Home, Zoom..."
            />
          </Field>
          <Field label="Description">
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Notes or agenda..."
            />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {editing ? (
            <Button
              variant="danger"
              onClick={() => deleteEvent(editing.id)}
            >
              <Trash2 size={13} className="mr-1.5 inline" />Delete
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              <X size={14} className="mr-1.5 inline" />Cancel
            </Button>
            <Button onClick={saveEvent}>
              {editing ? "Save changes" : "Save event"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Calendar;
