import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LoginScreenProps {
  onBack: () => void;
}

const REMEMBERED_EMAIL_KEY = "pulse_remembered_email";

export default function LoginScreen({ onBack }: LoginScreenProps) {
  const { signIn, resetPassword } = useAuth();

  const [mode, setMode] = useState<"login" | "forgot" | "register_info">("login");
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY));
    } catch {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (rememberMe && email.trim()) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      } else if (!rememberMe) {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [rememberMe, email]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "forgot") {
        if (!email.trim()) {
          throw new Error("Please enter your email address.");
        }
        const result = await resetPassword(email.trim());
        if (result.error) throw result.error;
        setMessage("Password reset instructions have been sent to your email.");
      } else {
        if (!email.trim() || !password) {
          throw new Error("Please enter both email and password.");
        }
        const result = await signIn(email.trim(), password);
        if (result.error) throw result.error;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign in failed. Please check your credentials."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-b from-[#070e14] via-[#050a0f] to-[#020508] select-none">
      {/* 1. Scenic Mountain-and-Forest Landscape Background (matching Reference Image 2) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/mountain-bg.jpg"
          alt="Scenic Mountain Forest Landscape"
          className="h-full w-full object-cover object-center scale-[1.02] transform-gpu transition-transform duration-1000"
        />
        {/* Dark Cinematic Glass Overlay for contrast and readability */}
        <div className="absolute inset-0 bg-black/45 sm:bg-black/40 backdrop-blur-[1.5px]" />
        {/* Subtle Edge Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      {/* Top Floating Return Button */}
      <button
        onClick={onBack}
        className="fixed top-5 left-5 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-medium text-zinc-300 backdrop-blur-xl transition hover:border-white/40 hover:bg-black/60 hover:text-white active:scale-95 touch-manipulation"
      >
        <ArrowLeft size={14} />
        <span>Back to Overview</span>
      </button>

      {/* 2. Centered Translucent Glassmorphism Card (Exact replica of Reference Image 2) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[390px] sm:max-w-[420px] rounded-[30px] sm:rounded-[34px] border border-white/[0.22] bg-black/45 sm:bg-black/40 p-7 sm:p-9 text-white backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.25)]"
      >
        <AnimatePresence mode="wait">
          {mode === "register_info" ? (
            /* Registration / Invitation Notice Screen */
            <motion.div
              key="register_info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg">
                <ShieldCheck size={24} />
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Private Workspace</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                  Public self-registration is closed to keep workspace data secure and private.
                  Accounts are provisioned by the workspace owner.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.05] p-4 text-left text-xs text-zinc-300 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-blue-400" />
                  <span className="leading-relaxed">If you were given credentials, use your assigned email and password on the login screen.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail size={15} className="mt-0.5 shrink-0 text-cyan-400" />
                  <span className="leading-relaxed">
                    Need help accessing your account? For assistance, contact{" "}
                    <a
                      href="mailto:ananda.krishh@gmail.com"
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors font-medium"
                    >
                      ananda.krishh@gmail.com
                    </a>
                    .
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full rounded-full bg-white py-3 px-5 text-xs font-semibold text-black transition hover:bg-zinc-200 active:scale-95"
              >
                Return to Login
              </button>
            </motion.div>
          ) : (
            /* Main Login & Password Reset Form */
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "forgot" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "forgot" ? -20 : 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Form Heading (matching "login" style in Reference Image 2) */}
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {mode === "login" ? "login" : "reset password"}
                </h2>
                <p className="mt-1 text-xs text-zinc-300/80">
                  {mode === "login"
                    ? "Your tasks, goals, and money — all in one place."
                    : "Enter your email to receive recovery instructions."}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {/* 1. Username / Email Input */}
                <div>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username or email"
                      className="w-full rounded-2xl sm:rounded-full border border-white/20 bg-white/[0.06] pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-400 outline-none transition focus:border-white/60 focus:bg-white/[0.1] focus:ring-1 focus:ring-white/40"
                    />
                  </div>
                </div>

                {/* 2. Password Input (Login mode only) */}
                {mode === "login" && (
                  <div>
                    <div className="relative">
                      <LockKeyhole
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        className="w-full rounded-2xl sm:rounded-full border border-white/20 bg-white/[0.06] pl-11 pr-11 py-3 text-sm text-white placeholder:text-zinc-400 outline-none transition focus:border-white/60 focus:bg-white/[0.1] focus:ring-1 focus:ring-white/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Row: Remember Me & Forgot Password (matching Reference Image 2) */}
                {mode === "login" && (
                  <div className="flex items-center justify-between px-1 text-xs text-zinc-300">
                    <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-white/30 bg-white/10 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setMessage("");
                      }}
                      className="hover:text-white transition underline-offset-4 hover:underline"
                    >
                      forget password
                    </button>
                  </div>
                )}

                {/* Inline Error Banner */}
                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/20 px-4 py-2.5 text-xs text-red-200">
                    <AlertCircle size={15} className="shrink-0 text-red-300" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Inline Success Banner */}
                {message && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2.5 text-xs text-emerald-200">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-300" />
                    <span>{message}</span>
                  </div>
                )}

                {/* 3. Primary Button (Solid white pill matching Reference Image 2) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-white py-3.5 px-6 text-sm font-bold text-black shadow-lg shadow-black/30 transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {busy ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                        <span>Please wait…</span>
                      </>
                    ) : (
                      <span>{mode === "login" ? "login" : "send reset link"}</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Row / Links */}
              <div className="mt-6 text-center text-xs text-zinc-300">
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => setMode("register_info")}
                    className="hover:text-white transition group"
                  >
                    <span>Dont have an account </span>
                    <strong className="text-white underline underline-offset-4 font-semibold group-hover:text-blue-300">
                      register
                    </strong>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setMessage("");
                    }}
                    className="text-white hover:underline transition"
                  >
                    ← Back to login
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
