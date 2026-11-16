import React, { useState } from 'react';
import FinancialForm from './components/FinancialForm';

export default function App() {
  const [lastValidationFriction, setLastValidationFriction] = useState(null);
  const [extractedContext, setExtractedContext] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const handleValidationFriction = (field, error, allErrors = []) => {
    setLastValidationFriction({
      field,
      error,
      allErrors,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleContextExtracted = (context) => {
    setExtractedContext(context);
  };

  const handleFormChange = (data) => {
    // Draft is automatically persisted in sessionStorage by FinancialForm
  };

  return (
    <div className="relative min-h-screen aurora-bg flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Decorative Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* SaaS Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 font-black text-sm">
              AG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">AuraGen</span>
                <span className="text-[11px] font-bold bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-full shadow-2xs">
                  ✨ Self-Healing UI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Member 1 – Frontend & Friction Detection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Draft Auto-Saved</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 border border-indigo-200/80 text-indigo-800 text-xs font-bold mb-4 shadow-2xs">
            <span className="animate-spin text-sm leading-none">⚙️</span>
            <span>AuraGen Adaptive Telemetry Active</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Apply for Credit with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Adaptive Intelligence
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-2.5 max-w-2xl leading-relaxed">
            AuraGen actively monitors cognitive load, cursor hesitation, and interaction friction. If complexity causes frustration, our generative AI self-heals this form into a guided conversational experience.
          </p>

          {/* 3 Colorful Feature Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-indigo-100/80 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                🎯
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Friction Detection</p>
                <p className="text-[11px] text-slate-400">Rage clicks & hesitation</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-purple-100/80 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
                🧠
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Cognitive Load</p>
                <p className="text-[11px] text-slate-400">0–100 real-time score</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 border border-pink-100/80 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center text-sm font-bold">
                🛡️
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Zero Data Loss</p>
                <p className="text-[11px] text-slate-400">Session auto-persistence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Form Component */}
        <div className="max-w-2xl mx-auto space-y-5">
          <FinancialForm
            onValidationFriction={handleValidationFriction}
            onFormChange={handleFormChange}
            onContextExtracted={handleContextExtracted}
            onSubmitSuccess={(data, context) => {
              setSubmittedData(data);
              setExtractedContext(context);
            }}
          />

          {/* Friction Notification Box */}
          {lastValidationFriction && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-300 text-xs text-amber-950 flex items-start gap-3 animate-fadeIn shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm shadow-amber-500/30">
                ⚡
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-amber-900 text-xs uppercase tracking-wider">
                    Cognitive Friction Detected
                  </p>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded-full font-bold">
                    {lastValidationFriction.timestamp}
                  </span>
                </div>
                <p className="text-amber-900/90 mt-1 font-medium">
                  Field: <code className="bg-white/90 text-amber-950 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">{lastValidationFriction.field}</code> — {lastValidationFriction.error}
                </p>
              </div>
            </div>
          )}

          {/* AI Context Contract Preview (Member 1 -> Member 3 integration) */}
          {extractedContext && (
            <div className="p-5 rounded-3xl bg-slate-900 text-slate-100 text-xs font-mono border border-slate-800 space-y-3 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-3">
                <span className="font-sans font-bold text-slate-200 flex items-center gap-2">
                  <span className="text-base">🤖</span> AI Form Context (Member 1 ➔ Member 3 Output)
                </span>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full">
                  JSON Schema Ready
                </span>
              </div>
              <pre className="text-[11px] overflow-x-auto text-emerald-400 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 leading-relaxed">
                {JSON.stringify(extractedContext.formContext, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200/80 bg-white/50 backdrop-blur-sm text-center text-xs text-slate-500 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">AuraGen AI</span>
            <span>•</span>
            <span>Infotact Solutions Internship Project</span>
          </div>
          <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold border border-slate-200">
            Branch: Aniket
          </span>
        </div>
      </footer>
    </div>
  );
}
