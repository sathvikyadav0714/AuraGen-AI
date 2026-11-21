import React, { useState } from 'react';
import FinancialForm from './components/FinancialForm';
import useTelemetry from './hooks/useTelemetry';
import { formatDuration } from './utils/telemetry';

export default function App() {
  const [lastValidationFriction, setLastValidationFriction] = useState(null);
  const [extractedContext, setExtractedContext] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // Initialize live non-invasive telemetry hook
  const { telemetry, recordValidationError, resetTelemetry } = useTelemetry({
    onFrictionEvent: (event) => {
      if (event.type === 'rage_click') {
        const severityTag = event.severity ? `[${event.severity.toUpperCase()}] ` : '';
        setLastValidationFriction({
          field: event.target,
          error: `${severityTag}Rage Click Burst Detected! (${event.clicksInBurst} rapid clicks in ${formatDuration(event.durationMs)} at ${event.frequency} clicks/s)`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'dead_click') {
        setLastValidationFriction({
          field: event.target,
          error: `Dead Click Detected (User repeatedly clicked a disabled or inactive element)`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'hesitation') {
        setLastValidationFriction({
          field: event.target,
          error: `Input Hesitation Detected (${formatDuration(event.durationMs)} delay before typing)`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'hesitation_abandoned') {
        setLastValidationFriction({
          field: event.target,
          error: `Field Hesitation & Abandonment (${formatDuration(event.durationMs)} hesitation then blurred)`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'inactivity_started') {
        setLastValidationFriction({
          field: 'User Session',
          error: `Inactivity Detected (User paused for ${formatDuration(event.idleDurationMs)})`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'inactivity_ended') {
        setLastValidationFriction({
          field: 'User Session',
          error: `Activity Resumed after ${formatDuration(event.pauseDurationMs)} pause`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }
  });

  const handleValidationFriction = (field, error, allErrors = []) => {
    recordValidationError(field, error);
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
            {/* Live Telemetry Status Pill */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs border ${telemetry.isCurrentlyInactive ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
              <span className={`w-2 h-2 rounded-full ${telemetry.isCurrentlyInactive ? 'bg-amber-500 animate-ping' : 'bg-indigo-500 animate-pulse'}`} />
              <span>
                {telemetry.isCurrentlyInactive
                  ? `Idle (${formatDuration(telemetry.currentInactivityDurationMs)})`
                  : 'Telemetry Live'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-Saved</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Live Behavioral Telemetry Mini-Bar (Day 8 Deliverable) */}
        <div className="mb-6 p-3 sm:p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-indigo-100 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${telemetry.isCurrentlyInactive ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
            <span className="font-bold text-slate-800">useTelemetry Engine:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-[11px]">
            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
              🖱️ Velocity: <strong className="text-indigo-600">{telemetry.cursorVelocity}</strong> px/ms (Avg: <strong className="text-indigo-500">{telemetry.averageVelocity}</strong>, Peak: <strong className="text-purple-600">{telemetry.peakVelocity}</strong>)
            </span>
            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
              🧭 Path: <strong className={`${telemetry.pathEfficiency > 60 ? 'text-emerald-600' : 'text-amber-600'}`}>{telemetry.pathEfficiency}%</strong>
            </span>
            <span className={`px-2 py-1 rounded-md ${telemetry.hesitationEventsCount > 0 ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-100 text-slate-700'}`}>
              🤔 Hesitations: <strong>{telemetry.hesitationEventsCount}</strong> (Index: <strong className="text-amber-700">{telemetry.hesitationIndex}</strong>)
            </span>
            <span className={`px-2 py-1 rounded-md ${telemetry.isCurrentlyInactive ? 'bg-amber-200 text-amber-900 font-bold' : 'bg-slate-100 text-slate-700'}`}>
              ⏳ Inactivity: <strong className="text-amber-700">{formatDuration(telemetry.totalInactivityDurationMs)}</strong>
              {telemetry.isCurrentlyInactive && (
                <span className="ml-1 text-amber-900">({formatDuration(telemetry.currentInactivityDurationMs)} pause)</span>
              )}
            </span>
            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
              🎯 Clicks: <strong className="text-slate-900">{telemetry.totalClickCount}</strong>
              {telemetry.peakClickFrequency > 0 && (
                <span className="ml-1 text-indigo-600">(Peak: {telemetry.peakClickFrequency}/s)</span>
              )}
            </span>
            <span className={`px-2 py-1 rounded-md ${telemetry.rageClickCount > 0 ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-slate-100 text-slate-700'}`}>
              ⚡ Rage Clicks: <strong>{telemetry.rageClickCount}</strong>
              {telemetry.rageScore > 0 && (
                <span className="ml-1 text-rose-700">(Score: {telemetry.rageScore})</span>
              )}
            </span>
            {telemetry.deadClickCount > 0 && (
              <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-md font-bold">
                🚫 Dead Clicks: <strong>{telemetry.deadClickCount}</strong>
              </span>
            )}
            <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
              🛑 Errors: <strong className="text-rose-600">{telemetry.validationErrorCount}</strong>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 border border-indigo-200/80 text-indigo-800 text-xs font-bold mb-3 shadow-2xs">
            <span>✨ Week 2 Milestone</span>
            <span>•</span>
            <span>Behavioral Telemetry & Friction Tracking</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Apply for Credit with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Adaptive Intelligence
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Move your cursor, test rapid clicking, or pause to experience AuraGen's passive behavioral telemetry in real-time.
          </p>
        </div>

        {/* Financial Form Component */}
        <div className="max-w-2xl mx-auto space-y-5">
          <FinancialForm
            onValidationFriction={handleValidationFriction}
            onFormChange={() => {}}
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
                    Friction Signal Triggered
                  </p>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded-full font-bold">
                    {lastValidationFriction.timestamp}
                  </span>
                </div>
                <p className="text-amber-900/90 mt-1 font-medium">
                  Target Field: <code className="bg-white/90 text-amber-950 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">{lastValidationFriction.field}</code> — {lastValidationFriction.error}
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
