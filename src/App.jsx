import React, { useState } from 'react';
import FinancialForm from './components/FinancialForm';

export default function App() {
  const [lastValidationFriction, setLastValidationFriction] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  const handleValidationFriction = (field, error, allErrors = []) => {
    setLastValidationFriction({
      field,
      error,
      allErrors,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleFormChange = (data) => {
    // Kept in state for upcoming telemetry & adaptive UI preservation
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* SaaS Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 font-bold text-sm">
              AG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">AuraGen</span>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                  Self-Healing UI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Member 1 – Frontend & Friction Detection</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-600">Frontend Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <span>✨ Phase 1 Foundation</span>
            <span>•</span>
            <span>Financial Form Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Apply for Business or Personal Credit
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
            AuraGen monitors user cognitive friction in real time. If form complexity causes hesitation or frustration, generative UI self-heals into a simplified conversational wizard.
          </p>
        </div>

        {/* Financial Form Component */}
        <div className="max-w-2xl mx-auto">
          <FinancialForm
            onValidationFriction={handleValidationFriction}
            onFormChange={handleFormChange}
            onSubmitSuccess={(data) => setSubmittedData(data)}
          />

          {/* Friction Monitor Preview Box (Day 1 Developer feedback) */}
          {lastValidationFriction && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <span className="text-base">⚡</span>
              <div>
                <p className="font-semibold">Friction Detected (Validation Trigger):</p>
                <p className="text-amber-700 mt-0.5">
                  Field: <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">{lastValidationFriction.field}</code> — {lastValidationFriction.error}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/60 text-center text-xs text-slate-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AuraGen AI – Infotact Solutions Internship Project</span>
          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
            Branch: Aniket
          </span>
        </div>
      </footer>
    </div>
  );
}
