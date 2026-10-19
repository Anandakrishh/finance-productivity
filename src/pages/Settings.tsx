import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Bell, Download, Upload, Trash2, RotateCcw, User, Shield, Database, Check, FileSpreadsheet, AlertTriangle, Eye, EyeOff, UserPlus, Copy, Sparkles } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Input, LiquidCard, Modal, Select, pageClass } from "../components/AppUI";
import { exportFinancialStatementExcel } from "../lib/exportFinancialExcel";
import { api } from "../lib/api";

type Appearance="dark"|"light"|"system";
type SettingsData={name:string;currency:string;appearance:Appearance;notifications:boolean;privacy:boolean;weekStarts:string};
type DangerAction = "clear" | "reset" | null;

const KEY="pulse-settings";
const defaults:SettingsData={name:"Anand",currency:"INR",appearance:"dark",notifications:true,privacy:false,weekStarts:"Monday"};

function load():SettingsData{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return defaults}}

function applyAppearance(value:Appearance){
 const root=document.documentElement; let theme=value;
 if(value==="system") theme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
 root.classList.toggle("pulse-dark",theme==="dark"); root.classList.toggle("pulse-light",theme==="light"); root.dataset.theme=theme; root.style.colorScheme=theme;
}

function Settings(){
 const [settings,setSettings]=useState<SettingsData>(load); const [saved,setSaved]=useState(false); const [exportingExcel,setExportingExcel]=useState(false); const {data}=useAppData(); const {user,signOut}=useAuth();
 const [dangerAction, setDangerAction] = useState<DangerAction>(null);
 const [dangerPassword, setDangerPassword] = useState("");
 const [showDangerPassword, setShowDangerPassword] = useState(false);
 const [verifyingDanger, setVerifyingDanger] = useState(false);
 const [dangerError, setDangerError] = useState<string | null>(null);

 // Account provisioning state
 const [newUserName, setNewUserName] = useState("");
 const [newUserEmail, setNewUserEmail] = useState("");
 const [newUserPassword, setNewUserPassword] = useState("");
 const [showNewUserPass, setShowNewUserPass] = useState(false);
 const [creatingUser, setCreatingUser] = useState(false);
 const [createUserError, setCreateUserError] = useState<string | null>(null);
 const [createdAccount, setCreatedAccount] = useState<{ name: string; email: string; password: string } | null>(null);
 const [copied, setCopied] = useState(false);

 useEffect(()=>applyAppearance(settings.appearance),[]);
 const update=<K extends keyof SettingsData>(key:K,value:SettingsData[K])=>{const next={...settings,[key]:value};setSettings(next);localStorage.setItem(KEY,JSON.stringify(next));if(key==="appearance")applyAppearance(value as Appearance);};
 const save=()=>{localStorage.setItem(KEY,JSON.stringify(settings));applyAppearance(settings.appearance);setSaved(true);setTimeout(()=>setSaved(false),1800)};
 const exportData=()=>{const payload={appName:"Finance",version:"2.0",exportedAt:new Date().toISOString(),settings,data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`finance-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)};
 const importData=(file:File)=>{const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(String(r.result));if(p.settings)localStorage.setItem(KEY,JSON.stringify({...defaults,...p.settings}));if(p.data)localStorage.setItem("pulse-app-data",JSON.stringify(p.data));alert("Backup imported. Reloading.");location.reload()}catch{alert("That backup file is not valid.")}};r.readAsText(file)};
 const handleExportExcel=async()=>{try{setExportingExcel(true);await exportFinancialStatementExcel(data,{currency:settings.currency,userName:settings.name});}catch(err){console.error("Excel export error:",err);alert("Failed to export Excel statement.");}finally{setExportingExcel(false);}};

 const handleDangerConfirm = async () => {
   if (!dangerPassword) {
     setDangerError("Please enter your login password.");
     return;
   }
   setVerifyingDanger(true);
   setDangerError(null);
   try {
     const email = user?.email;
     if (!email) {
       throw new Error("No active user session found. Please sign in again.");
     }

     // Authenticate password with backend
     await api.auth.login(email, dangerPassword);

     // Password confirmed! Wipe remote D1 tables for this user
     const tables = [
       "tasks",
       "goals",
       "habits",
       "transactions",
       "assets",
       "liabilities",
       "budgets",
       "savings_goals",
       "investments",
       "calendar_events",
       "emis",
     ];
     await Promise.allSettled(tables.map((t) => api.data.replaceTable(t, [])));

     if (dangerAction === "clear") {
       localStorage.removeItem("pulse-app-data");
       localStorage.removeItem("pulse-calendar-events");
       localStorage.removeItem("pulse-investments");
       localStorage.removeItem("pulse-budget-categories");
       localStorage.removeItem("pulse-savings-goals");
       location.reload();
     } else if (dangerAction === "reset") {
       localStorage.clear();
       location.reload();
     }
   } catch (err: any) {
     console.error("Danger zone authorization error:", err);
     setDangerError(err?.message || "Incorrect password. Authentication failed.");
     setVerifyingDanger(false);
   }
 };

 const generatePassword = () => {
   const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
   let pass = "";
   for (let i = 0; i < 10; i++) {
     pass += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   setNewUserPassword(pass);
 };

 const copyCredentials = async () => {
   if (!createdAccount) return;
   const text = `PULSE Workspace Login Credentials:\nURL: ${window.location.origin}\nEmail: ${createdAccount.email}\nPassword: ${createdAccount.password}\n\nPlease sign in at the URL above.`;
   try {
     await navigator.clipboard.writeText(text);
     setCopied(true);
     setTimeout(() => setCopied(false), 2200);
   } catch {
     alert("Failed to copy automatically. Please copy the credentials manually.");
   }
 };

 const handleCreateUser = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!newUserEmail.trim() || !newUserPassword) {
     setCreateUserError("Please enter both email and password.");
     return;
   }
   if (newUserPassword.length < 6) {
     setCreateUserError("Password must be at least 6 characters.");
     return;
   }
   setCreatingUser(true);
   setCreateUserError(null);
   try {
     const res = await api.auth.createUser(
       newUserEmail.trim(),
       newUserPassword,
       newUserName.trim() || undefined
     );
     setCreatedAccount({
       name: res.user.displayName || newUserName.trim() || "User",
       email: newUserEmail.trim(),
       password: newUserPassword,
     });
     setNewUserName("");
     setNewUserEmail("");
     setNewUserPassword("");
   } catch (err: any) {
     console.error("Failed to create user:", err);
     setCreateUserError(err?.message || "Failed to create account. Please try again.");
   } finally {
     setCreatingUser(false);
   }
 };

 return <div className={pageClass}>
  <div className="mb-7"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-500">Control center</p><h1 className="text-3xl font-semibold">Settings</h1><p className="mt-1 text-sm text-zinc-500">Shape your workspace around how you actually live and work.</p></div>
  <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
   <div className="space-y-5">
    <LiquidCard className="p-5 sm:p-6"><Header icon={<User size={16}/>} title="Profile" description="How your workspace is identified"/><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Display name"><Input value={settings.name} onChange={e=>update("name",e.target.value)}/></Field><Field label="Currency"><Select value={settings.currency} onChange={e=>update("currency",e.target.value)}><option value="INR">₹ INR — Indian Rupee</option><option value="USD">$ USD — US Dollar</option><option value="EUR">€ EUR — Euro</option><option value="GBP">£ GBP — Pound</option></Select></Field></div></LiquidCard>
    <LiquidCard className="p-5 sm:p-6"><Header icon={<Moon size={16}/>} title="Appearance" description="Choose the visual mode that feels right"/><div className="mt-5 grid grid-cols-3 gap-2">{([{value:"dark" as Appearance,label:"Dark",icon:<Moon size={15}/>},{value:"light" as Appearance,label:"Light",icon:<Sun size={15}/>},{value:"system" as Appearance,label:"System",icon:<Monitor size={15}/>}]).map(item=><button key={item.value} onClick={()=>update("appearance",item.value)} className={`rounded-2xl border p-4 text-left transition ${settings.appearance===item.value?"border-white/[.15] bg-white/[.07]":"border-white/[.06] bg-white/[.02] hover:bg-white/[.04]"}`}><div className="mb-4 text-zinc-400">{item.icon}</div><p className="text-xs font-medium">{item.label}</p></button>)}</div></LiquidCard>
    <LiquidCard className="p-5 sm:p-6"><Header icon={<Bell size={16}/>} title="Preferences" description="Keep the experience quiet or proactive"/><div className="mt-3 divide-y divide-white/[.05]"><ToggleRow label="Notifications" description="Allow reminders and alerts" checked={settings.notifications} onChange={v=>update("notifications",v)}/><ToggleRow label="Privacy mode" description="Hide sensitive financial figures in summaries" checked={settings.privacy} onChange={v=>update("privacy",v)}/></div></LiquidCard>
    
    {/* Provision New Account Card */}
    <LiquidCard className="p-5 sm:p-6">
      <Header icon={<UserPlus size={16}/>} title="Provision New Account" description="Create an account and share login credentials directly"/>
      
      {createdAccount ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
            <Check size={16} />
            <span>Account created successfully!</span>
          </div>
          <p className="text-zinc-400 mb-3">
            Share these login credentials with <strong className="text-white">{createdAccount.name}</strong>:
          </p>
          <div className="space-y-1.5 rounded-xl border border-white/[0.08] bg-black/40 p-3 font-mono text-[11px] text-zinc-300">
            <p><span className="text-zinc-500 select-none">URL: </span>{window.location.origin}</p>
            <p><span className="text-zinc-500 select-none">Email: </span><span className="text-emerald-300 font-semibold">{createdAccount.email}</span></p>
            <p><span className="text-zinc-500 select-none">Password: </span><span className="text-[#60A5FA] font-semibold">{createdAccount.password}</span></p>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              onClick={copyCredentials}
            >
              {copied ? <><Check size={14} className="mr-1.5 inline"/>Copied to Clipboard!</> : <><Copy size={14} className="mr-1.5 inline"/>Copy Login Credentials</>}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCreatedAccount(null)}
            >
              Provision Another Account
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name / Display name">
              <Input
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </Field>
            <Field label="Email address">
              <Input
                type="email"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
            </Field>
          </div>

          <Field label="Account Password (min 6 characters)">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showNewUserPass ? "text" : "password"}
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Set initial password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewUserPass(!showNewUserPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showNewUserPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={generatePassword}
                className="shrink-0 text-xs border border-white/[0.08]"
              >
                <Sparkles size={13} className="mr-1 inline text-[#22B8FF]"/>Generate
              </Button>
            </div>
          </Field>

          {createUserError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 p-2.5 text-xs text-red-300">
              <AlertTriangle size={14} className="shrink-0 text-red-400"/>
              <span>{createUserError}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={creatingUser}
              className="bg-white text-black hover:bg-zinc-200"
            >
              <UserPlus size={14} className="mr-2 inline"/>
              {creatingUser ? "Creating account..." : "Create Account"}
            </Button>
          </div>
        </form>
      )}
    </LiquidCard>

    <div className="flex justify-end"><Button onClick={save}>{saved?<><Check size={14} className="mr-2 inline"/>Saved</>: "Save settings"}</Button></div>
   </div>
   <div className="space-y-5">
    <LiquidCard className="p-5">
      <Header icon={<Database size={16}/>} title="Data & Statements" description="Export statement or manage backups"/>
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-[#2563FF]/30 bg-[#2563FF]/[0.08] p-3">
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563FF]/20 text-[#60A5FA]">
              <FileSpreadsheet size={16}/>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-100">Financial Statement (.xlsx)</p>
              <p className="text-[10px] text-zinc-400">Multi-sheet Excel with Income, Expenses, Savings, Portfolio & EMIs</p>
            </div>
          </div>
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-md shadow-blue-500/25 hover:brightness-110" 
            onClick={handleExportExcel}
            disabled={exportingExcel}
          >
            <FileSpreadsheet size={14} className="mr-2 inline"/>
            {exportingExcel ? "Generating Excel..." : "Export Financial Statement (Excel)"}
          </Button>
        </div>
        <div className="space-y-2 pt-2 border-t border-white/[.06]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Workspace Backups</p>
          <Button className="w-full" variant="ghost" onClick={exportData}><Download size={14} className="mr-2 inline"/>Export backup</Button>
          <label className="block cursor-pointer"><span className="flex w-full items-center justify-center rounded-xl border border-white/[.08] bg-white/[.035] px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[.07]"><Upload size={14} className="mr-2"/>Import backup</span><input type="file" accept=".json" className="hidden" onChange={e=>e.target.files?.[0]&&importData(e.target.files[0])}/></label>
        </div>
      </div>
    </LiquidCard>
    <LiquidCard className="p-5"><Header icon={<Shield size={16}/>} title="Workspace status" description="Quick data footprint"/><div className="mt-5 grid grid-cols-2 gap-3">{Object.entries({Tasks:data.tasks.length,Goals:data.goals.length,Habits:data.habits.length,Transactions:data.transactions.length,Investments:data.investments.length,Events:data.calendarEvents.length}).map(([k,v])=><div key={k} className="rounded-xl bg-white/[.025] p-3"><p className="text-[9px] text-zinc-600">{k}</p><p className="mt-1 text-sm">{v}</p></div>)}</div></LiquidCard>
    <LiquidCard className="p-5">
      <Header icon={<Trash2 size={16}/>} title="Danger zone" description="These actions affect local workspace data"/>
      <div className="mt-5 space-y-2">
        <p className="mb-3 text-[10px] text-zinc-600">Signed in as {user?.email || "User"}</p>
        <Button variant="ghost" className="w-full" onClick={()=>void signOut()}>
          <Shield size={14} className="mr-2 inline"/>Sign out
        </Button>
        <Button 
          variant="danger" 
          className="w-full" 
          onClick={() => {
            setDangerAction("clear");
            setDangerPassword("");
            setDangerError(null);
          }}
        >
          <Trash2 size={14} className="mr-2 inline"/>Clear application data
        </Button>
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => {
            setDangerAction("reset");
            setDangerPassword("");
            setDangerError(null);
          }}
        >
          <RotateCcw size={14} className="mr-2 inline"/>Reset workspace
        </Button>
      </div>
    </LiquidCard>
   </div>
  </div>

  {/* Danger Zone Password Verification Modal */}
  <Modal
    open={dangerAction !== null}
    title={dangerAction === "clear" ? "Clear application data" : "Reset workspace"}
    onClose={() => {
      if (!verifyingDanger) {
        setDangerAction(null);
        setDangerPassword("");
        setDangerError(null);
      }
    }}
  >
    <div className="space-y-4 pt-1">
      <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
        <div>
          <p className="font-semibold text-red-200">
            {dangerAction === "clear" ? "Permanent Data Deletion" : "Permanent Workspace Reset"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-red-300/85">
            {dangerAction === "clear"
              ? "This will permanently delete all your tasks, transactions, habits, goals, budgets, and investments. This action cannot be undone."
              : "This will permanently delete all application data, reset all settings, and restore your workspace to its default initial state."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Security Verification</span>
        <p className="mt-1 text-zinc-300">
          Enter your login password for <span className="font-semibold text-white">{user?.email || "your account"}</span> to verify and authorize this action:
        </p>
      </div>

      <Field label="Login Password">
        <div className="relative">
          <Input
            type={showDangerPassword ? "text" : "password"}
            value={dangerPassword}
            onChange={(e) => {
              setDangerPassword(e.target.value);
              if (dangerError) setDangerError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && dangerPassword && !verifyingDanger) {
                void handleDangerConfirm();
              }
            }}
            placeholder="Enter your account login password"
            className="pr-10"
            autoFocus
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowDangerPassword(!showDangerPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showDangerPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      {dangerError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2.5 text-xs font-medium text-red-300">
          <AlertTriangle size={14} className="shrink-0 text-red-400" />
          <span>{dangerError}</span>
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          onClick={() => {
            setDangerAction(null);
            setDangerPassword("");
            setDangerError(null);
          }}
          disabled={verifyingDanger}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDangerConfirm}
          disabled={!dangerPassword || verifyingDanger}
        >
          {verifyingDanger
            ? "Verifying..."
            : dangerAction === "clear"
            ? "Confirm & Clear Data"
            : "Confirm & Reset Workspace"}
        </Button>
      </div>
    </div>
  </Modal>
 </div>
}
function Header({icon,title,description}:{icon:React.ReactNode;title:string;description:string}){return <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[.05] text-zinc-400">{icon}</div><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-zinc-600">{description}</p></div></div>}
function ToggleRow({label,description,checked,onChange}:{label:string;description:string;checked:boolean;onChange:(v:boolean)=>void}){return <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-xs text-zinc-300">{label}</p><p className="mt-1 text-[10px] text-zinc-600">{description}</p></div><button onClick={()=>onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked?"bg-white":"bg-white/[.08]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full transition ${checked?"left-6 bg-black":"left-1 bg-zinc-500"}`}/></button></div>}
export default Settings;
