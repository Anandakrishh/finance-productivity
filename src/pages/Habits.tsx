import { useMemo, useState } from "react";
import { Plus, Flame, Check, Circle, Pencil, Trash2, CalendarDays } from "lucide-react";
import { useAppData, type AppHabit, type Frequency } from "../context/AppDataContext";
import { Button, Field, Input, LiquidCard, Modal, Select, pageClass } from "../components/AppUI";

const categories=["Health","Learning","Finance","Personal","Career"];
const frequencies: Frequency[]=["Daily","Weekdays","Weekly"];

function Habits(){
 const {data,setHabits}=useAppData(); const [show,setShow]=useState(false); const [editing,setEditing]=useState<AppHabit|null>(null);
 const today=new Date().toISOString().slice(0,10);
 const [form,setForm]=useState({name:"",category:"Health",frequency:"Daily" as Frequency});
 const todayDone=data.habits.filter(h=>h.completedDates.includes(today)).length;
 const consistency=data.habits.length?Math.round(todayDone/data.habits.length*100):0;
 const openNew=()=>{setEditing(null);setForm({name:"",category:"Health",frequency:"Daily"});setShow(true)};
 const edit=(h:AppHabit)=>{setEditing(h);setForm({name:h.name,category:h.category,frequency:h.frequency});setShow(true)};
 const save=()=>{if(!form.name.trim())return;if(editing)setHabits(list=>list.map(h=>h.id===editing.id?{...h,...form}:h));else setHabits(list=>[...list,{...form,id:Date.now(),streak:0,bestStreak:0,completedDates:[]}]);setShow(false)};
 const toggle=(id:number)=>setHabits(list=>list.map(h=>{if(h.id!==id)return h;const done=h.completedDates.includes(today);const dates=done?h.completedDates.filter(d=>d!==today):[...h.completedDates,today];return {...h,completedDates:dates,streak:done?Math.max(0,h.streak-1):h.streak+1,bestStreak:Math.max(h.bestStreak,done?h.bestStreak:h.streak+1)}}));
 const recentDays=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10)}),[]);
 return <div className={pageClass}>
  <div className="mb-7 flex items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Consistency</p><h1 className="text-3xl font-semibold">Habits</h1><p className="mt-1 text-sm text-zinc-500">Small actions, repeated until they become identity.</p></div><Button onClick={openNew}><Plus size={14} className="mr-2 inline"/>New habit</Button></div>
  <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Kpi label="Today" value={`${todayDone}/${data.habits.length}`}/><Kpi label="Consistency" value={`${consistency}%`}/><Kpi label="Best streak" value={`${Math.max(0,...data.habits.map(h=>h.bestStreak))}d`}/><Kpi label="Active habits" value={data.habits.length}/></div>
  <div className="grid gap-4 lg:grid-cols-2">{data.habits.map(h=><LiquidCard key={h.id} className="p-5"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[.05] text-zinc-400"><Flame size={18}/></div><div><p className="text-sm font-medium">{h.name}</p><p className="text-[10px] text-zinc-600">{h.category} · {h.frequency}</p></div></div><div className="flex gap-1"><button onClick={()=>edit(h)} className="p-2 text-zinc-600 hover:text-white"><Pencil size={14}/></button><button onClick={()=>setHabits(list=>list.filter(x=>x.id!==h.id))} className="p-2 text-zinc-600 hover:text-red-300"><Trash2 size={14}/></button></div></div><div className="mt-5 flex items-center justify-between"><div><p className="text-[10px] text-zinc-600">Current streak</p><p className="mt-1 text-2xl font-semibold">{h.streak}<span className="ml-1 text-xs text-zinc-600">days</span></p></div><button onClick={()=>toggle(h.id)} className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${h.completedDates.includes(today)?"border-white/[.15] bg-white text-black":"border-white/[.07] bg-white/[.025] text-zinc-600 hover:text-white"}`}>{h.completedDates.includes(today)?<Check size={18}/>:<Circle size={18}/>}</button></div><div className="mt-5 grid grid-cols-7 gap-1.5">{recentDays.map(d=><div key={d} className={`h-7 rounded-lg ${h.completedDates.includes(d)?"bg-white":"bg-white/[.045]"}`} title={d}/>)}</div><div className="mt-2 flex justify-between text-[9px] text-zinc-700"><span><CalendarDays size={10} className="mr-1 inline"/>7-day rhythm</span><span>Best {h.bestStreak}d</span></div></LiquidCard>)}</div>
  <Modal open={show} title={editing?"Edit habit":"Create habit"} onClose={()=>setShow(false)}><div className="grid gap-4"><Field label="Habit name"><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Read 20 pages"/></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Category"><Select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</Select></Field><Field label="Frequency"><Select value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value as Frequency})}>{frequencies.map(f=><option key={f}>{f}</option>)}</Select></Field></div></div><div className="mt-5 flex justify-end"><Button onClick={save}>{editing?"Save changes":"Create habit"}</Button></div></Modal>
 </div>
}
function Kpi({label,value}:{label:string;value:string|number}){return <LiquidCard className="p-4"><p className="text-[10px] text-zinc-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></LiquidCard>}
export default Habits;
