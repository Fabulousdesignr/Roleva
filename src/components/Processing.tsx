import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Check, Sparkles, BrainCircuit } from "lucide-react";
import logoIcon from "../assets/roleva_icon.svg";

const STEPS = [
  "Parsing uploaded resume structures...",
  "Synthesizing job requirements and credentials...",
  "Calculating comparative match score alignment...",
  "Extracting missing critical keywords...",
  "Optimizing weak task-oriented bullets to quantified achievements...",
  "Adapting vocabulary and tone for company personality type...",
  "Assembling final polished resume document..."
];

export default function Processing() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // We want to progress through the steps gradually over several seconds to create a realistic, high-value feeling
    const stepDuration = 2200; // 2.2 seconds per step
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="processing-root" className="min-h-[85vh] flex flex-col items-center justify-center p-6 bg-[#fafbfe]">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10 space-y-8 relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-[80px] opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full blur-[80px] opacity-30 pointer-events-none" />

        {/* Header visual */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring outer */}
            <span className="absolute inline-flex h-16 w-16 rounded-full bg-blue-100 animate-ping opacity-30" />
            
            {/* Official Roleva brand icon image */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <img src={logoIcon} alt="Roleva Icon" className="w-15 h-15 object-contain rounded-2xl animate-pulse" referrerPolicy="no-referrer" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Analyzing Credentials
            </h3>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Roleva Expert Resume System
            </p>
          </div>
        </div>

        {/* Global Progress Line Area */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-500 font-mono">
            <span>STRATEGIZING PROGRESS</span>
            <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ ease: "easeInOut", duration: 0.8 }}
            />
          </div>
        </div>

        {/* Detailed Stages Lists */}
        <div className="space-y-3.5 pt-2">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            const isFuture = idx > currentStep;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 transition-all duration-300 ${
                  isActive ? "scale-[1.01]" : ""
                }`}
              >
                {/* Step indicator */}
                <span className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <span className="w-5.5 h-5.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : isActive ? (
                    <span className="w-5.5 h-5.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </span>
                  ) : (
                    <span className="w-5.5 h-5.5 rounded-full bg-slate-50 text-slate-300 border border-slate-200 flex items-center justify-center text-[10px] font-mono">
                      {idx + 1}
                    </span>
                  )}
                </span>

                {/* Step text */}
                <div className="flex-grow">
                  <p
                    className={`text-sm tracking-tight font-medium ${
                      isCompleted
                        ? "text-slate-400 line-through decoration-slate-200/80"
                        : isActive
                        ? "text-blue-700 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {step}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Helpful waiting feedback footer info */}
        <div className="text-center pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Generating structured JSON outputs & custom positioning tone.</span>
        </div>

      </div>
    </div>
  );
}
