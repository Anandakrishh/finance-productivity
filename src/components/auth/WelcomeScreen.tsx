import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckSquare,
  Wallet,
  Eye,
  Shield,
} from "lucide-react";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#02050e] text-white selection:bg-blue-500/30 selection:text-white">
      {/* 1. Fine Geometric Grid Lines Background (matching Reference Image 1) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <svg
          className="h-full w-full opacity-[0.09]"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="welcome-grid"
              width="64"
              height="64"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 64 0 L 0 0 0 64"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#welcome-grid)" />
        </svg>

        {/* Ambient Electric Blue Radial Glows */}
        <div className="absolute -top-32 right-[10%] h-[550px] w-[550px] rounded-full bg-blue-600/[0.12] blur-[140px]" />
        <div className="absolute top-[40%] -left-36 h-[600px] w-[600px] rounded-full bg-indigo-600/[0.09] blur-[150px]" />
        <div className="absolute -bottom-28 right-[25%] h-[500px] w-[500px] rounded-full bg-sky-600/[0.08] blur-[140px]" />
      </div>

      {/* Main Responsive Container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-5 py-6 sm:px-8 sm:py-10 lg:px-12">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
              <span className="text-sm font-black tracking-tight select-none">AK</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#02050e] bg-blue-400" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">AK FINANCE</span>
              <p className="text-[11px] text-zinc-400">Productivity & Personal Finance</p>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="my-auto py-8 lg:py-12">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Left Column: Headline & Description */}
            <div className="space-y-6">
              {/* Geometric Accent Icon (Insp. by Reference Image 1) */}
              <div className="inline-flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-950/30 px-3.5 py-2 backdrop-blur-md">
                {/* Micro Geometric Composition */}
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rotate-45 border border-blue-400/60" />
                  <div className="h-3 w-3 rounded-[2px] bg-blue-500 shadow-sm shadow-blue-500/50" />
                  <div className="h-2 w-2 rounded-full border border-white/60" />
                </div>
                <span className="text-xs font-medium tracking-wide text-blue-200">
                  Unified System for Tasks & Wealth
                </span>
              </div>

              {/* Main Typography (Strictly matching prompt) */}
              <h1 className="text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                PLAN,
                <br />
                MANAGE &
                <br />
                <span className="flex flex-wrap items-center gap-3 text-blue-400">
                  <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]">
                    TRACK
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/15 text-blue-300 shadow-inner sm:h-12 sm:w-12">
                    <Eye size={20} className="sm:size-6" />
                  </span>
                  <span>YOUR LIFE</span>
                </span>
              </h1>

              {/* Supporting Description */}
              <p className="max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Stay organized and take control of your life and money in one place. Manage daily tasks,
                build better habits, track your spending, plan your savings, and stay on top of your financial goals.
              </p>

              {/* Primary Call to Action Button (Pill button with circular blue arrow matching Reference Image 1) */}
              <div className="pt-2 sm:pt-4">
                <button
                  onClick={onGetStarted}
                  className="group relative inline-flex items-center justify-between gap-6 rounded-full border border-blue-500/40 bg-[#07132b]/80 p-2 pl-7 pr-2.5 shadow-[0_12px_40px_rgba(37,99,235,0.28),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-xl transition-all duration-300 hover:border-blue-400 hover:bg-[#0c1c3d] hover:shadow-[0_16px_50px_rgba(37,99,235,0.45)] active:scale-[0.98] touch-manipulation"
                >
                  <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                    Get Started
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 transition-all duration-300 group-hover:scale-105 group-hover:bg-blue-500">
                    <ArrowUpRight size={22} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </button>
              </div>
            </div>

            {/* Right Column: Two Feature Category Cards */}
            <div className="space-y-4 sm:space-y-5">
              {/* Category 1: Tasks & Productivity */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 transition-colors hover:border-blue-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-600/10 text-blue-400">
                      <CheckSquare size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-white">Tasks & Productivity</h3>
                      <p className="text-xs text-zinc-400">Execution, routines & focus</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                    3 Modules
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <span><strong className="text-white">Daily, weekly, and monthly task tracking</strong> with status and filters</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <span><strong className="text-white">Goals, habits, routines, and progress</strong> with active streak scoring</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <span><strong className="text-white">Task prioritization and completion tracking</strong> with visual heatmap</span>
                  </li>
                </ul>
              </motion.div>

              {/* Category 2: Personal Finance */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 backdrop-blur-xl shadow-xl shadow-black/40 transition-colors hover:border-indigo-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-600/10 text-indigo-400">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-white">Personal Finance</h3>
                      <p className="text-xs text-zinc-400">Cash flow, wealth & budgets</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
                    5 Engines
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-300">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span><strong className="text-white">Income and expense tracking</strong> with smooth trend curves</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span><strong className="text-white">Daily, weekly, and monthly financial summaries</strong> with Excel export</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span><strong className="text-white">Budgeting, savings, and EMI tracking</strong> with schedule calculators</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span><strong className="text-white">Net worth and financial goal monitoring</strong> with assets & liabilities</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Footer Bar */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-400" />
            <span>Private & Encrypted Personal Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onGetStarted}
              className="hover:text-zinc-300 transition"
            >
              Sign In
            </button>
            <span>•</span>
            <span>Cloudflare D1 & Fast Edge Sync</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
