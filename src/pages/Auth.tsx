import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const { signIn, resetPassword } = useAuth();

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "forgot") {
        const result = await resetPassword(email.trim());

        if (result.error) {
          throw result.error;
        }

        setMessage(
          "Password reset instructions have been sent to your email."
        );
      } else {
        const result = await signIn(
          email.trim(),
          password
        );

        if (result.error) {
          throw result.error;
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "login"
      ? "Welcome back"
      : "Reset your password";

  const subtitle =
    mode === "login"
      ? "Your life, work and money — in one calm workspace."
      : "We'll send you a secure password reset link.";

  return (
    <div className="min-h-screen overflow-hidden bg-[#060709] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.08),transparent_32%),radial-gradient(circle_at_80%_90%,rgba(130,150,255,.07),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center p-5 lg:p-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/[.08] bg-white/[.025] shadow-2xl shadow-black/50 backdrop-blur-3xl lg:grid-cols-[1.05fr_.95fr]">

          {/* Left panel */}
          <section className="hidden border-r border-white/[.07] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-lg shadow-white/10">
                  <span className="text-base font-black tracking-tighter text-black select-none">AK</span>
                </div>

                <div>
                  <div className="text-lg font-semibold tracking-tight">
                    FINANCE
                  </div>

                  <div className="text-[9px] uppercase tracking-[.25em] text-zinc-600">
                    Life OS
                  </div>
                </div>
              </div>

              <div className="mt-20 max-w-md">
                <p className="text-xs uppercase tracking-[.25em] text-zinc-500">
                  One system for your life
                </p>

                <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight">
                  Make progress visible.
                </h1>

                <p className="mt-6 text-sm leading-7 text-zinc-500">
                  Plan your days, build habits, track goals and understand
                  your money without jumping between disconnected apps.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-500">
              <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-4">
                <CheckCircle2
                  size={15}
                  className="mb-3 text-zinc-300"
                />
                Tasks, goals & habits
              </div>

              <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-4">
                <CheckCircle2
                  size={15}
                  className="mb-3 text-zinc-300"
                />
                Money & net worth
              </div>
            </div>
          </section>

          {/* Right panel */}
          <section className="p-6 sm:p-10 lg:p-12 xl:p-14">
            <div className="mx-auto max-w-md">

              {/* Mobile logo */}
              <div className="mb-10 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black shadow-lg shadow-white/10">
                    <span className="text-sm font-black tracking-tighter text-black select-none">AK</span>
                  </div>

                  <div className="text-lg font-semibold">
                    FINANCE
                  </div>
                </div>
              </div>

              <p className="text-xs uppercase tracking-[.22em] text-zinc-600">
                Personal workspace
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {subtitle}
              </p>

              <form
                onSubmit={submit}
                className="mt-8 space-y-4"
              >
                {/* Email */}
                <label className="block">
                  <span className="mb-2 block text-xs text-zinc-400">
                    Email
                  </span>

                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-3.5 text-zinc-600"
                    />

                    <input
                      className="w-full rounded-2xl border border-white/[.08] bg-white/[.03] px-10 py-3 text-sm outline-none transition placeholder:text-zinc-700 focus:border-white/[.18]"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </label>

                {/* Password */}
                {mode !== "forgot" && (
                  <label className="block">
                    <span className="mb-2 block text-xs text-zinc-400">
                      Password
                    </span>

                    <div className="relative">
                      <LockKeyhole
                        size={15}
                        className="absolute left-3 top-3.5 text-zinc-600"
                      />

                      <input
                        className="w-full rounded-2xl border border-white/[.08] bg-white/[.03] px-10 py-3 text-sm outline-none transition placeholder:text-zinc-700 focus:border-white/[.18]"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </label>
                )}

                {/* Error */}
                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs leading-5 text-red-200">
                    {error}
                  </div>
                )}

                {/* Success */}
                {message && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs leading-5 text-emerald-200">
                    {message}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign in"
                      : "Send reset link"}

                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Secondary actions */}
              <div className="mt-6 flex flex-col items-center gap-3 text-xs text-zinc-600">

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setMessage("");
                    }}
                    className="hover:text-white"
                  >
                    Forgot password?
                  </button>
                )}

                {mode === "forgot" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setMessage("");
                    }}
                    className="hover:text-white"
                  >
                    Back to sign in
                  </button>
                )}

                <div className="mt-2 flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] text-zinc-500">
                  <LockKeyhole size={12} className="text-zinc-500" />
                  <span>Private workspace · Access by invitation only</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}