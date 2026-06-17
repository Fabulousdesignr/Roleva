import { motion } from "motion/react";
import { ArrowRight, Sparkles, FileText, CheckCircle2, Award, Zap, TrendingUp, Compass } from "lucide-react";
import logoLight from "../assets/roleva_logo_light.svg";

interface LandingProps {
  onStart: () => void;
  historyList: any[];
  onLoadHistoryItem: (item: any) => void;
}

export default function Landing({ onStart, historyList, onLoadHistoryItem }: LandingProps) {
  return (
    <div id="landing-root" className="relative min-h-[90vh] flex flex-col justify-between overflow-hidden bg-[#fafbfe]">
      {/* Decorative Grid and Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eef2f7_1px,transparent_1px),linear-gradient(to_bottom,#eef2f7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-[-10%] left-[10%] w-[450px] h-[450px] bg-blue-100 rounded-full blur-[120px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[120px] opacity-30 pointer-events-none" />

      {/* Header Bar */}
      <header id="landing-header" className="relative border-b border-gray-100 bg-white/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={logoLight} alt="Roleva Logo" className="h-8.5 w-auto object-contain" referrerPolicy="no-referrer" />
            <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-100">
              Challenger Pro
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI ENGINE LIVE</span>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main id="landing-main" className="relative flex-grow flex items-center px-6 py-12 md:py-20">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium"
            >
              <Zap className="w-3.5 h-3.5 fill-blue-100" />
              <span>Next-Gen Personalization for Resume Success</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight font-sans leading-[1.1]"
            >
              Tailor Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800">Resume</span> to the Right <span className="underline decoration-blue-500/30 decoration-wavy">Role</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans"
            >
              Upload your base resume and any job description. Roleva evaluates your actual job compatibility, completely optimizes weak experience bullets, and adapts your voice for Startups, Enterprise scale, or Creative Agencies.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                id="btn-get-started"
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>No registration required</span>
              </div>
            </motion.div>

            {/* History List for Returning Users */}
            {historyList && historyList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    Workspace Campaign History ({historyList.length})
                  </div>
                  <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Workspace Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                  {historyList.map((hist) => (
                    <button
                      key={hist.id}
                      onClick={() => onLoadHistoryItem(hist)}
                      className="text-left p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 hover:shadow-xs transition-all cursor-pointer flex flex-col gap-1 text-slate-700 bg-white"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-blue-600 truncate flex-1">
                          {hist.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono shrink-0">
                          {hist.results?.matchScore}% Fit
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 line-clamp-1">
                        @ {hist.company}
                      </p>
                      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-50 font-mono text-[9px] text-slate-400">
                        <span>{hist.timestamp}</span>
                        <span className="text-blue-600 font-bold uppercase tracking-wider text-[8px]">View Kit →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Target Audience List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-6 border-t border-slate-200/60"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center lg:text-left">
                Strategized for Professional Roles
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {["Developers", "Designers", "Product Managers", "Job Seekers", "Freelancers", "Marketing"].map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs bg-white text-slate-600 rounded-md border border-slate-200 shadow-xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Hero Right - Interactive Feature Bento */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            {/* Main Visual Card */}
            <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
              
              {/* Feature 1 */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm">Match Alignment Score</h3>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-100">78% Fit</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal mt-1">
                    Detect exact skills gaps, highlight requirement strengths, and understand why you might fit.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Resume Improvements</h3>
                  <p className="text-xs text-slate-500 leading-normal mt-1">
                    Flashes original task bullets and automatically translates them to quantitative metric outcomes.
                  </p>
                  
                  {/* Miniature comparison visualization */}
                  <div className="mt-2.5 space-y-1.5 font-mono text-[9px] bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <div className="text-red-500 line-through truncate">Before: designed app screens</div>
                    <div className="text-emerald-600 font-semibold truncate">After: Designed 30+ onboarding screens causing +18% conversion</div>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Resume Style Recommendation</h3>
                  <p className="text-xs text-slate-500 leading-normal mt-1">
                    Automatically refines terminology depending on whether the destination is a startup, enterprise, or agency.
                  </p>
                </div>
              </div>

            </div>

            {/* Decorative flying elements */}
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-500 rounded-2xl shadow-lg -rotate-12 flex items-center justify-center text-white pointer-events-none border border-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-md text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 pointer-events-none rotate-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Instant PDF Exports
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer Info */}
      <footer id="landing-footer" className="w-full border-t border-slate-100 bg-white/50 py-6 px-6 text-center text-xs text-slate-400 font-sans">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Roleva Resume Intelligence. Let's apply smarter, not blind.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-600">Privacy First</span>
            <span className="text-slate-200">|</span>
            <span className="hover:text-slate-600 text-slate-500 font-mono">Gemini 3.5 Flash Powered</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
