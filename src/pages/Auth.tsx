import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen from "../components/auth/WelcomeScreen";
import LoginScreen from "../components/auth/LoginScreen";

export default function Auth() {
  const [step, setStep] = useState<"welcome" | "login">(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("step") === "login" ? "login" : "welcome";
    } catch {
      return "welcome";
    }
  });

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        setStep(params.get("step") === "login" ? "login" : "welcome");
      } catch {
        setStep("welcome");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleGetStarted = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("step", "login");
      window.history.pushState({ step: "login" }, "", url.toString());
    } catch {
      // Fallback
    }
    setStep("login");
  };

  const handleBackToWelcome = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("step");
      window.history.pushState({ step: "welcome" }, "", url.pathname + (url.search || ""));
    } catch {
      // Fallback
    }
    setStep("welcome");
  };

  return (
    <div className="min-h-screen w-full bg-[#02050e]">
      <AnimatePresence mode="wait">
        {step === "welcome" ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <WelcomeScreen onGetStarted={handleGetStarted} />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <LoginScreen onBack={handleBackToWelcome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}