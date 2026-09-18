import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckSquare, Flame, Target, CalendarDays } from "lucide-react";
import Tasks from "./Tasks";
import Habits from "./Habits";
import Goals from "./Goals";
import Calendar from "./Calendar";

type SubTab = "tasks" | "habits" | "goals" | "calendar";

interface TabItem {
  id: SubTab;
  label: string;
  fullLabel?: string;
  icon: typeof CheckSquare;
}

const TABS: TabItem[] = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "habits", label: "Habits", icon: Flame },
  { id: "goals", label: "Goals", fullLabel: "Goals (3M / 6M / 1Y)", icon: Target },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

function Productivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get("tab") as SubTab | null;

  const activeTab: SubTab = useMemo(() => {
    if (queryTab && ["tasks", "habits", "goals", "calendar"].includes(queryTab)) {
      return queryTab;
    }
    return "tasks";
  }, [queryTab]);

  const [tab, setTab] = useState<SubTab>(activeTab);

  // Sync tab with URL if URL changes
  useMemo(() => {
    if (queryTab && ["tasks", "habits", "goals", "calendar"].includes(queryTab) && queryTab !== tab) {
      setTab(queryTab);
    }
  }, [queryTab]);

  const handleSelectTab = (selectedId: SubTab) => {
    setTab(selectedId);
    setSearchParams({ tab: selectedId }, { replace: true });
  };

  return (
    <div className="w-full">
      {/* Sub-tab navigation bar - iOS Floating Frosted Glass Capsule Dock */}
      <div className="sticky top-[66px] z-30 flex items-center justify-center py-3 sm:py-4 px-4 pointer-events-none">
        <div className="productivity-subnav-dock pointer-events-auto max-w-full overflow-x-auto flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/[0.16] bg-white/[0.07] p-1.5 backdrop-blur-3xl shadow-[0_12px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]">
          {TABS.map((item) => {
            const isActive = tab === item.id;
            const Icon = item.icon;

            return isActive ? (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3.5 sm:px-4 py-2 text-xs font-semibold text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-300"
                title={item.label}
              >
                <Icon size={15} className="text-zinc-950 shrink-0" />
                <span className="tracking-tight whitespace-nowrap">
                  {item.fullLabel ? (
                    <>
                      <span className="hidden md:inline">{item.fullLabel}</span>
                      <span className="md:hidden">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </span>
              </button>
            ) : (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className="flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.1] active:scale-95 transition-all duration-200"
                title={item.label}
              >
                <Icon size={15} className="text-zinc-400 group-hover:text-white shrink-0 transition-colors" />
                <span className="tracking-tight whitespace-nowrap">
                  {item.fullLabel ? (
                    <>
                      <span className="hidden md:inline">{item.fullLabel}</span>
                      <span className="md:hidden">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active view */}
      <div>
        {tab === "tasks" && <Tasks />}
        {tab === "habits" && <Habits />}
        {tab === "goals" && <Goals />}
        {tab === "calendar" && <Calendar />}
      </div>
    </div>
  );
}

export default Productivity;
