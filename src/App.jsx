import React, { useState, useMemo, useEffect } from 'react';
import FinancialForm from './components/FinancialForm';
import useTelemetry from './hooks/useTelemetry';
import { formatDuration } from './utils/telemetry';
import { initSession, getSessionId } from './services/sessionManager';
import { createSessionApi, sendTelemetryEventApi } from './services/apiClient';
import useWebSocket, { DEFAULT_WS_URL } from './hooks/useWebSocket';
import GlowCard from './components/ui/GlowCard';

export default function App() {
  const [lastValidationFriction, setLastValidationFriction] = useState(null);
  const [extractedContext, setExtractedContext] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // Task 3: Session State Management
  const [sessionId, setSessionId] = useState(() => getSessionId());
  const [sessionOrigin, setSessionOrigin] = useState('cached');

  // Task 4: Inbound Generative UI Schema State
  const [adaptiveUiPayload, setAdaptiveUiPayload] = useState(null);
  const [showAdaptiveBanner, setShowAdaptiveBanner] = useState(false);

  // Initialize or restore session on mount (Task 3)
  useEffect(() => {
    let isMounted = true;
    async function setupSession() {
      try {
        const session = await initSession(createSessionApi);
        if (isMounted) {
          setSessionId(session.sessionId);
          setSessionOrigin(session.origin);
        }
      } catch (err) {
        console.warn('AuraGen: Session initialization fallback:', err);
      }
    }
    setupSession();
    return () => { isMounted = false; };
  }, []);

  // Task 4: Live Frontend WebSocket Connection
  const {
    isConnected: isWsConnected,
    isConnecting: isWsConnecting,
    lastMessage: wsLastMessage,
    reconnectCount: wsReconnectCount,
    sendMessage: sendWsMessage
  } = useWebSocket(DEFAULT_WS_URL, {
    sessionId,
    autoConnect: true,
    onMessage: (msg) => {
      if (msg?.type === 'ui_generated' || msg?.type === 'UI_GENERATED') {
        setAdaptiveUiPayload(msg);
        setShowAdaptiveBanner(true);
      }
    }
  });

  // Watch for inbound WebSocket messages (Task 4)
  useEffect(() => {
    if (!wsLastMessage) return;
    if (wsLastMessage.type === 'ui_generated' || wsLastMessage.type === 'UI_GENERATED') {
      setAdaptiveUiPayload(wsLastMessage);
      setShowAdaptiveBanner(true);
    }
  }, [wsLastMessage]);

  // Initialize live non-invasive telemetry hook
  const { telemetry, recordValidationError, resetTelemetry } = useTelemetry({
    onFrictionEvent: (event) => {
      // Task 2: Dispatch detected telemetry event to backend API
      if (sessionId) {
        sendTelemetryEventApi(sessionId, event, cognitiveScore).catch(() => {});
      }

      if (event.type === 'rage_click') {
        const severityTag = event.severity ? `[${event.severity.toUpperCase()}] ` : '';
        setLastValidationFriction({
          type: 'rage_click',
          field: event.target,
          title: `${severityTag}Rage Click Burst Detected`,
          description: `${event.clicksInBurst} rapid clicks in ${formatDuration(event.durationMs)} (${event.frequency} clicks/s)`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'dead_click') {
        setLastValidationFriction({
          type: 'dead_click',
          field: event.target,
          title: 'Dead Click Detected',
          description: 'User repeatedly clicked on a disabled or non-interactive element.',
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'hesitation') {
        setLastValidationFriction({
          type: 'hesitation',
          field: event.target,
          title: 'Input Hesitation Detected',
          description: `${formatDuration(event.durationMs)} cognitive pause before first keystroke.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'hesitation_abandoned') {
        setLastValidationFriction({
          type: 'hesitation_abandoned',
          field: event.target,
          title: 'Field Abandonment Hesitation',
          description: `User focused for ${formatDuration(event.durationMs)} then abandoned without typing.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'inactivity_started') {
        setLastValidationFriction({
          type: 'inactivity',
          field: 'User Session',
          title: 'User Inactivity State',
          description: `No mouse or keyboard interaction for ${formatDuration(event.idleDurationMs)}.`,
          timestamp: new Date().toLocaleTimeString()
        });
      } else if (event.type === 'inactivity_ended') {
        setLastValidationFriction({
          type: 'resumed',
          field: 'User Session',
          title: 'Activity Resumed',
          description: `User returned after ${formatDuration(event.pauseDurationMs)} pause.`,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }
  });

  // Calculate dynamic cognitive load score (0–100)
  const cognitiveScore = useMemo(() => {
    let score = 10; // Baseline
    score += telemetry.hesitationEventsCount * 12;
    score += telemetry.rageClickCount * 25;
    score += telemetry.validationErrorCount * 15;
    score += telemetry.deadClickCount * 8;
    if (telemetry.pathEfficiency < 40) score += 10;
    if (telemetry.isCurrentlyInactive) score += 12;
    return Math.min(100, Math.max(5, score));
  }, [
    telemetry.hesitationEventsCount,
    telemetry.rageClickCount,
    telemetry.validationErrorCount,
    telemetry.deadClickCount,
    telemetry.pathEfficiency,
    telemetry.isCurrentlyInactive
  ]);

  const cognitiveLevel = useMemo(() => {
    if (cognitiveScore >= 65) {
      return {
        label: 'High Friction (Generative UI Triggered)',
        color: 'text-rose-400',
        badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        barColor: 'from-amber-500 to-rose-500',
        icon: 'alert-triangle'
      };
    }
    if (cognitiveScore >= 35) {
      return {
        label: 'Moderate Cognitive Load',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        barColor: 'from-indigo-500 to-amber-500',
        icon: 'clock'
      };
    }
    return {
      label: 'Optimal Focus (Normal Flow)',
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      barColor: 'from-emerald-500 to-indigo-500',
      icon: 'check'
    };
  }, [cognitiveScore]);

  const handleValidationFriction = (field, error, allErrors = []) => {
    recordValidationError(field, error);
    setLastValidationFriction({
      type: 'validation_error',
      field,
      title: 'Validation Friction Triggered',
      description: error,
      allErrors,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const handleContextExtracted = (context) => {
    setExtractedContext(context);
  };

  // Viva Simulator Triggers
  const simulateHesitationDemo = () => {
    const el = document.getElementById('loanAmount');
    if (el) {
      el.focus();
      setTimeout(() => {
        setLastValidationFriction({
          type: 'hesitation',
          field: 'loanAmount',
          title: 'Simulation: Cognitive Hesitation',
          description: 'User focused on Requested Loan for 2.6s. Model diagnosing EMI calculation friction.',
          timestamp: new Date().toLocaleTimeString()
        });
      }, 500);
    }
  };

  const simulateRageClickDemo = () => {
    setLastValidationFriction({
      type: 'rage_click',
      field: 'submitApplicationBtn',
      title: '[SEVERE] Simulation: Rage Click Burst',
      description: '4 rapid clicks within 340ms (11.8 clicks/s) detected on Submit button.',
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const simulateValidationErrorDemo = () => {
    handleValidationFriction(
      'loanAmount',
      'Requested loan amount cannot exceed 10x your annual gross income.'
    );
  };

  return (
    <div className="relative min-h-screen realistic-bg flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Top Floating Ambient Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[650px] h-[400px] bg-indigo-500/25 rounded-full blur-[140px] pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-48 right-10 w-[550px] h-[350px] bg-purple-500/25 rounded-full blur-[130px] pointer-events-none -z-10 animate-float-reverse" />
      <div className="absolute bottom-20 left-10 w-[500px] h-[300px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute top-1/2 left-1/3 w-[450px] h-[280px] bg-pink-500/20 rounded-full blur-[130px] pointer-events-none -z-10 animate-float-reverse" />

      {/* Enterprise Executive Header */}
      <header className="bg-slate-950/40 backdrop-blur-2xl border-b border-white/[0.08] sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-black text-sm tracking-wider">
              AG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-100 text-lg tracking-tight">AuraGen</span>
                <span className="text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  Self-Healing UI
                </span>
                <span className="hidden md:inline-flex text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                  v2.0 Architecture
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Member 1: <strong className="text-slate-200">Aniket Sarovar</strong> – Frontend & Behavioral Friction Detection
              </p>
            </div>
          </div>

          {/* Real-time Status Badges */}
          <div className="flex items-center gap-3">
            {/* Task 4: Live WebSocket Status Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isWsConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : isWsConnecting
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-400'
            }`} title={`WebSocket endpoint: ${DEFAULT_WS_URL}`}>
              <span className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-400 animate-ping' : isWsConnecting ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
              }`} />
              <span className="hidden sm:inline">
                {isWsConnected
                  ? 'WS: Live (Member 2)'
                  : isWsConnecting
                  ? `WS: Reconnecting (${wsReconnectCount}/5)`
                  : 'WS: Standalone Mode'}
              </span>
              <span className="sm:hidden">{isWsConnected ? 'WS On' : 'WS Off'}</span>
            </div>

            {/* Task 3: Active Session ID Pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300" title={`Active Session ID (${sessionOrigin})`}>
              <span className="text-slate-500">Sess:</span>
              <span className="text-indigo-300 font-bold max-w-[120px] truncate">{sessionId ? sessionId.replace('aura_sess_', '') : 'Initializing...'}</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-sans uppercase font-bold">{sessionOrigin}</span>
            </div>

            {/* Live Telemetry Health Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${telemetry.isCurrentlyInactive ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'}`}>
              <span className={`w-2 h-2 rounded-full ${telemetry.isCurrentlyInactive ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
              <span className="hidden sm:inline">
                {telemetry.isCurrentlyInactive
                  ? `Inactivity Paused (${formatDuration(telemetry.currentInactivityDurationMs)})`
                  : 'Telemetry Engine Live'}
              </span>
              <span className="sm:hidden">
                {telemetry.isCurrentlyInactive ? 'Idle' : 'Live'}
              </span>
            </div>

            {/* Evaluation Tag */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Infotact Viva Mode</span>
            </div>
          </div>
        </div>

        {/* Examiner Viva Toolbar (1-Click Demonstration Actions) */}
        <div className="bg-slate-950/30 backdrop-blur-xl border-t border-white/[0.06] py-2 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-semibold">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Viva Demonstration Actions:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={simulateHesitationDemo}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-[11px] flex items-center gap-1.5 transition"
              >
                <span>⏱️</span>
                <span>Simulate Hesitation</span>
              </button>

              <button
                type="button"
                onClick={simulateRageClickDemo}
                className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-semibold text-[11px] flex items-center gap-1.5 transition"
              >
                <span>⚡</span>
                <span>Simulate Rage Click</span>
              </button>

              <button
                type="button"
                onClick={simulateValidationErrorDemo}
                className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 font-semibold text-[11px] flex items-center gap-1.5 transition"
              >
                <span>🛑</span>
                <span>Simulate Error Mismatch</span>
              </button>

              {/* Task 4 Viva Demo: Inbound WebSocket Generative UI Simulation */}
              <button
                type="button"
                onClick={() => {
                  const demoSchema = {
                    type: 'ui_generated',
                    source: 'Member 2 Backend WebSocket',
                    schema: {
                      title: 'Conversational Micro-Step Wizard',
                      description: 'AI detected cognitive friction and generated a 2-step adaptive layout.',
                      steps: [
                        { id: 'step1', title: 'Personal Identification', required: ['fullName', 'email'] },
                        { id: 'step2', title: 'Income & Loan Details', required: ['annualIncome', 'loanAmount'] }
                      ]
                    },
                    preservedData: extractedContext?.formContext?.formData || { fullName: 'Aniket Sarovar' }
                  };
                  setAdaptiveUiPayload(demoSchema);
                  setShowAdaptiveBanner(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 font-semibold text-[11px] flex items-center gap-1.5 transition"
              >
                <span>📡</span>
                <span>Simulate WS Adaptive Signal</span>
              </button>

              <button
                type="button"
                onClick={resetTelemetry}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition"
              >
                <span>↺</span>
                <span>Reset Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: 2-Column Responsive Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Task 4: Inbound Generative UI Notification Banner */}
          {showAdaptiveBanner && adaptiveUiPayload && (
            <div className="col-span-1 lg:col-span-12 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-950/90 border-2 border-indigo-500/60 shadow-2xl animate-fadeIn space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-lg shadow-glow-indigo">
                    ✨
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-100 tracking-tight">
                        Adaptive Generative UI Payload Received via WebSocket
                      </h4>
                      <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                        Member 2 ➔ Member 1 Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      High cognitive friction triggered server-side UI generation. User input data is fully preserved.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdaptiveBanner(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition self-end sm:self-center"
                >
                  Dismiss ✕
                </button>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto max-h-36">
                <pre>{JSON.stringify(adaptiveUiPayload, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Left Column (7/12 cols): Financial Assessment Form */}
          <div className="lg:col-span-7 space-y-6">
            <FinancialForm
              sessionId={sessionId}
              onValidationFriction={handleValidationFriction}
              onFormChange={() => {}}
              onContextExtracted={handleContextExtracted}
              activeFocusField={telemetry.activeFocusField}
              currentFocusDurationMs={telemetry.currentFocusDurationMs}
              onSubmitSuccess={(data, context) => {
                setSubmittedData(data);
                setExtractedContext(context);
              }}
            />
          </div>

          {/* Right Column (5/12 cols): Live Cognitive Telemetry & Friction Radar */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            {/* 1. Live Cognitive Load Meter Card with Animated Circular Radial Gauge */}
            <GlowCard accent="indigo" className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100 tracking-tight">Cognitive Load Index</h3>
                    <p className="text-[11px] text-slate-400">Real-time composite friction score</p>
                  </div>
                </div>

                <span className={`text-xs font-black font-mono px-3 py-1 rounded-full border transition-all duration-300 ${cognitiveLevel.badgeBg}`}>
                  {cognitiveScore} / 100
                </span>
              </div>

              {/* Radial Gauge & Progress Display */}
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-950/25 backdrop-blur-md border border-white/[0.08] mb-4">
                {/* Circular Animated SVG Gauge */}
                <div className="relative w-18 h-18 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${cognitiveScore >= 65 ? 'text-rose-500' : cognitiveScore >= 35 ? 'text-amber-400' : 'text-emerald-400'} transition-all duration-700 ease-out`}
                      strokeDasharray={`${cognitiveScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono font-black text-xs text-slate-100">
                    {cognitiveScore}%
                  </span>
                </div>

                {/* Progress Details */}
                <div className="flex-1 space-y-2">
                  <div className="w-full bg-slate-900 rounded-full h-2 p-0.5 border border-slate-800">
                    <div
                      className={`h-1 rounded-full bg-gradient-to-r ${cognitiveLevel.barColor} transition-all duration-700 ease-out shadow-lg`}
                      style={{ width: `${cognitiveScore}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${cognitiveLevel.color} flex items-center gap-1.5`}>
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      {cognitiveLevel.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Classification: {cognitiveScore < 35 ? 'Low' : cognitiveScore < 65 ? 'Medium' : 'High'}</span>
                <span>Adaptive UI Trigger: &gt; 65</span>
              </div>
            </GlowCard>

            {/* 2. Real-Time Friction Diagnosis Card with Active Cyber Radar Line */}
            <GlowCard accent="cyan" className="p-6 space-y-4">
              {/* Cyber Radar Sweep Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent pointer-events-none animate-radar-sweep" />

              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  Active Behavioral Radar
                </span>
                <span className="text-[10px] text-slate-400 font-mono">60 FPS Passive Tracking</span>
              </div>

              {/* Active Target Dwell Status */}
              <div className="p-3.5 rounded-2xl bg-slate-950/25 backdrop-blur-md border border-white/[0.08] text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Currently Focused Field:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {telemetry.activeFocusField || 'None (Hovering)'}
                  </span>
                </div>
                {telemetry.activeFocusField && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Focus Dwell Time:</span>
                    <span className={`font-mono font-bold ${telemetry.currentFocusDurationMs >= 2000 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {formatDuration(telemetry.currentFocusDurationMs)} {telemetry.currentFocusDurationMs >= 2000 ? '(Hesitation Threshold Reached)' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Latest Friction Trigger Alert with Glowing Border Pulse */}
              {lastValidationFriction ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-amber-500/60 text-xs animate-fadeIn animate-border-glow space-y-2 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      {lastValidationFriction.title}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md font-bold">
                      {lastValidationFriction.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium leading-relaxed">
                    {lastValidationFriction.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Target: <code className="bg-slate-800 text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">{lastValidationFriction.field}</code>
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950/25 backdrop-blur-md border border-white/[0.08] text-xs text-slate-400 flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>No cognitive friction detected yet. Interacting with the form or click a Viva Action above.</span>
                </div>
              )}

              {/* Kinematic Metrics 4-Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950/25 backdrop-blur-md rounded-xl border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Cursor Velocity</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold font-mono text-indigo-400">{telemetry.cursorVelocity}</span>
                    <span className="text-[10px] text-slate-400">px/ms</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Peak: {telemetry.peakVelocity} px/ms</span>
                </div>

                <div className="p-3 bg-slate-950/25 backdrop-blur-md rounded-xl border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Path Trajectory</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-extrabold font-mono ${telemetry.pathEfficiency > 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {telemetry.pathEfficiency}%
                    </span>
                    <span className="text-[10px] text-slate-400">Efficiency</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Erratic Score: {telemetry.erraticMovementScore}</span>
                </div>

                <div className="p-3 bg-slate-950/25 backdrop-blur-md rounded-xl border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Hesitation Events</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold font-mono text-amber-400">{telemetry.hesitationEventsCount}</span>
                    <span className="text-[10px] text-slate-400">delays &gt; 2s</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Index: {telemetry.hesitationIndex}</span>
                </div>

                <div className="p-3 bg-slate-950/25 backdrop-blur-md rounded-xl border border-white/[0.08]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Rapid Clicks</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-extrabold font-mono ${telemetry.rageClickCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {telemetry.rageClickCount}
                    </span>
                    <span className="text-[10px] text-slate-400">Bursts</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dead Clicks: {telemetry.deadClickCount}</span>
                </div>
              </div>
            </GlowCard>

            {/* 3. AI Schema Context Contract Preview */}
            {extractedContext && (
              <GlowCard accent="emerald" className="p-5 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between text-slate-300 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    AI Form Context Contract (Member 1 ➔ Member 3)
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    Schema Validated
                  </span>
                </div>
                <pre className="text-[11px] overflow-x-auto text-emerald-400 bg-slate-950/30 backdrop-blur-md p-3.5 rounded-xl border border-white/[0.08] leading-relaxed font-mono">
                  {JSON.stringify(extractedContext.formContext, null, 2)}
                </pre>
              </GlowCard>
            )}
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className="py-8 border-t border-white/[0.08] bg-slate-950/25 backdrop-blur-xl text-xs text-slate-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-200">AuraGen AI</span>
            <span>•</span>
            <span>Self-Healing Generative UI via Cognitive Load</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Infotact Solutions Internship</span>
            <span className="font-mono bg-slate-900 text-indigo-400 border border-slate-800 px-2.5 py-1 rounded-md font-semibold">
              Branch: Aniket
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
