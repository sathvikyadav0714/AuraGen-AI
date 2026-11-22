import React, { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import { AnimatePresence } from 'framer-motion'
import TransitionManager from '../components/TransitionManager'
import DynamicRenderer from '../components/DynamicRenderer'
import useWebSocket from '../hooks/useWebSocket'
import useTelemetry from '../hooks/useTelemetry'
import {
  createSession,
  saveFormData,
  getFormData,
  sendTelemetryEvent,
  triggerGenerationRequest,
  submitFormToBackend,
} from '../lib/api'

const DEMO_SCHEMA = {
  steps: [
    {
      id: 'personal',
      title: "Let's start with your name",
      description: 'We just need a few basic details.',
      components: [
        { type: 'TextInput', id: 'fullName', name: 'fullName', label: 'Full Name', placeholder: 'e.g. Priya Sharma', required: true },
        { type: 'EmailInput', id: 'email', name: 'email', label: 'Email Address', placeholder: 'you@example.com', required: true }
      ]
    },
    {
      id: 'financial',
      title: 'Your financial details',
      description: 'Tell us about your income and what you need.',
      components: [
        {
          type: 'SelectInput', id: 'employmentStatus', name: 'employmentStatus', label: 'What best describes you?', required: true,
          options: [
            { value: 'salaried', label: 'Salaried Employee' },
            { value: 'self_employed', label: 'Self Employed' },
            { value: 'business', label: 'Business Owner' },
            { value: 'student', label: 'Student' }
          ]
        },
        { type: 'NumberInput', id: 'annualIncome', name: 'annualIncome', label: 'Annual Income (₹)', placeholder: 'e.g. 750000', required: true },
        { type: 'NumberInput', id: 'loanAmount', name: 'loanAmount', label: 'Loan Amount Needed (₹)', placeholder: 'e.g. 250000', required: true }
      ]
    },
    {
      id: 'contact',
      title: 'Almost done!',
      description: 'Just your phone number to complete the application.',
      components: [
        { type: 'PhoneInput', id: 'phone', name: 'phone', label: 'Phone Number', placeholder: '9876543210', required: true },
        { type: 'InfoBlock', id: 'info1', name: 'info1', label: 'Privacy Note', message: 'Your information is encrypted and never shared with third parties.' }
      ]
    }
  ],
  metadata: { generatedAt: new Date().toISOString(), version: '1.0' }
}

export default function AuraGenPage() {
  const [sessionId, setSessionId] = useState(null)
  const [mode, setMode] = useState('original')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [preservedFormData, setPreservedFormData] = useState({
    fullName: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    annualIncome: '750000',
    loanAmount: '250000',
  })
  const [uiSchema, setUiSchema] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle')

  const autoSaveDebounceRef = useRef(null)

  // 1. Initialize Backend Session on mount
  useEffect(() => {
    let mounted = true
    async function initSession() {
      const session = await createSession()
      if (mounted && session?.sessionId) {
        setSessionId(session.sessionId)
        console.info('[AuraGen] Session initialized:', session.sessionId)
      }
    }
    initSession()
    return () => { mounted = false }
  }, [])

  // 2. Real-time Telemetry Tracking Hook
  const {
    cognitiveScore,
    setCognitiveScore,
    recordValidationError,
    recordFailedInteraction,
    emitTelemetry,
  } = useTelemetry(sessionId)

  // 3. Real-time WebSocket Connection directly bound to Session ID (Port 5000)
  const {
    isConnected,
    connectionState,
    lastMessage,
    error: wsError,
    sendMessage,
    simulateServerMessage,
  } = useWebSocket('ws://localhost:5000', sessionId)

  // 4. Handle incoming WebSocket backend messages
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'cognitive_load_update' || lastMessage.type === 'friction_evaluated') {
      const score = lastMessage.cognitiveLoadScore ?? lastMessage.score ?? lastMessage.data?.cognitiveLoadScore
      if (typeof score === 'number') {
        setCognitiveScore(score)
      }
    } else if (lastMessage.type === 'ui_generation_started') {
      setMode('loading')
    } else if (lastMessage.type === 'ui_generated' || lastMessage.type === 'generation_completed') {
      const schema = lastMessage.schema || lastMessage.data?.schema
      if (schema) {
        setUiSchema(schema)
        if (lastMessage.preservedData || lastMessage.data?.preservedData) {
          setPreservedFormData(prev => ({ ...prev, ...(lastMessage.preservedData || lastMessage.data?.preservedData) }))
        }
        setMode('wizard')
      }
    } else if (lastMessage.type === 'ui_generation_failed' || lastMessage.type === 'generation_error') {
      setMode('original')
    }
  }, [lastMessage, setCognitiveScore])

  // 5. Backend Form Auto-Save with Debounce (solves Team Leader item 1)
  const triggerAutoSave = useCallback((dataToSave) => {
    setSaveStatus('saving')
    // Local session backup
    try {
      sessionStorage.setItem('auragen_form_data', JSON.stringify(dataToSave))
    } catch {}

    // Backend save debounced
    if (autoSaveDebounceRef.current) {
      clearTimeout(autoSaveDebounceRef.current)
    }
    autoSaveDebounceRef.current = setTimeout(async () => {
      if (sessionId) {
        const saved = await saveFormData(sessionId, dataToSave)
        setSaveStatus(saved ? 'saved_backend' : 'saved_local')
      } else {
        setSaveStatus('saved_local')
      }
    }, 600)
  }, [sessionId])

  const handleFieldChange = (field, value) => {
    setPreservedFormData(prev => {
      const updated = { ...prev, [field]: value }
      triggerAutoSave(updated)
      return updated
    })
  }

  // 6. Trigger AI Generation (calls backend /api/sessions/:id/generate)
  const handleTriggerTransformation = useCallback(async (simulatedScore = 88) => {
    setCognitiveScore(simulatedScore)
    setMode('loading')

    // Persist current state before generation
    if (sessionId) {
      await saveFormData(sessionId, preservedFormData)
      // Send high friction telemetry event
      await sendTelemetryEvent(sessionId, {
        eventType: 'rage_click',
        field: 'form_submission_gate',
        cognitiveLoadScore: simulatedScore,
      })
      // Trigger generation endpoint
      triggerGenerationRequest(sessionId)
    }

    // Safety fallback timer if backend takes longer or is offline
    setTimeout(() => {
      setMode(currentMode => {
        if (currentMode === 'loading') {
          setUiSchema(DEMO_SCHEMA)
          return 'wizard'
        }
        return currentMode
      })
    }, 1800)
  }, [sessionId, preservedFormData, setCognitiveScore])

  // 7. Real Backend Form Submission (solves Team Leader item 5)
  const handleFinalSubmit = useCallback(async (finalData) => {
    setIsSubmitting(true)
    const result = await submitFormToBackend(sessionId, finalData)
    setIsSubmitting(false)
    setSubmissionResult(result)
  }, [sessionId])

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Head>
        <title>AuraGen – Self-Healing Adaptive UI</title>
      </Head>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 transition-all">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
              <span className="text-white font-bold text-xs tracking-wider">AG</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 tracking-tight text-base">AuraGen</span>
              <span className="text-[11px] font-medium tracking-wide bg-blue-50 text-blue-600 border border-blue-100/60 px-2 py-0.5 rounded-full">
                Self-Healing UI
              </span>
            </div>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-gray-50 border border-gray-100">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-400 ring-2 ring-amber-100'}`} />
              <span className="font-medium text-gray-500">
                {isConnected ? 'Backend Connected' : 'Simulated Demo'}
              </span>
            </div>

            {/* Demo trigger button */}
            {mode === 'original' && (
              <button
                onClick={() => handleTriggerTransformation(88)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 text-xs font-medium shadow-sm transition-all duration-200"
              >
                <span>✨</span>
                <span>Simulate High Friction</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        <TransitionManager mode={mode} cognitiveScore={cognitiveScore}>
          <AnimatePresence mode="wait">
            {mode === 'original' && (
              <div key="original" className="max-w-xl mx-auto space-y-4">
                {/* Interactive Original Form for Testing Data Preservation */}
                <div className="card py-8 px-8 border border-gray-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] rounded-3xl bg-white">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">📋</span>
                      <div>
                        <h1 className="text-base font-bold text-gray-900 tracking-tight">
                          Original Financial Form
                        </h1>
                        <p className="text-[11px] text-gray-400">
                          Pre-fill data below to test automatic state preservation
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                      {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'Connecting...'}
                    </span>
                  </div>

                  {/* Auto-save status indicator */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 px-1">
                    <span>Backend Auto-Save:</span>
                    <span className={`font-medium ${saveStatus === 'saved_backend' ? 'text-emerald-600' : saveStatus === 'saving' ? 'text-amber-600' : 'text-gray-500'}`}>
                      {saveStatus === 'saved_backend' ? '✓ Synced to Backend API' : saveStatus === 'saving' ? 'Saving to backend...' : 'Ready'}
                    </span>
                  </div>

                  <div className="space-y-3.5 mb-6 text-left">
                    <div>
                      <label className="label-text">Full Name</label>
                      <input
                        type="text"
                        className="input-field"
                        value={preservedFormData.fullName || ''}
                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                        placeholder="e.g. Rahul Verma"
                      />
                    </div>
                    <div>
                      <label className="label-text">Email Address</label>
                      <input
                        type="email"
                        className="input-field"
                        value={preservedFormData.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-text">Annual Income (₹)</label>
                        <input
                          type="number"
                          className="input-field"
                          value={preservedFormData.annualIncome || ''}
                          onChange={(e) => handleFieldChange('annualIncome', e.target.value)}
                          placeholder="750000"
                        />
                      </div>
                      <div>
                        <label className="label-text">Loan Amount (₹)</label>
                        <input
                          type="number"
                          className="input-field"
                          value={preservedFormData.loanAmount || ''}
                          onChange={(e) => handleFieldChange('loanAmount', e.target.value)}
                          placeholder="250000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trigger Transformation Card */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-left">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-blue-900">
                        Cognitive Friction Trigger
                      </span>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Score: 88/100
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 leading-normal mb-3">
                      Simulate high user cognitive load to transform this form into Member 4's dynamic conversational wizard.
                    </p>
                    <button
                      onClick={() => handleTriggerTransformation(88)}
                      className="btn-primary w-full text-xs py-2.5"
                    >
                      Trigger UI Self-Healing →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(mode === 'loading' || mode === 'wizard') && (
              <div key="wizard">
                <DynamicRenderer
                  uiSchema={mode === 'wizard' ? uiSchema : null}
                  isLoading={mode === 'loading'}
                  preservedData={preservedFormData}
                  onStateChange={(updatedData) => {
                    setPreservedFormData(prev => ({ ...prev, ...updatedData }))
                    triggerAutoSave(updatedData)
                  }}
                  onComplete={handleFinalSubmit}
                  onCancel={() => {
                    setMode('original')
                    setUiSchema(null)
                    setCognitiveScore(0)
                  }}
                />

                {/* Real Submission Result Notice */}
                {submissionResult && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-xs text-emerald-800">
                    <p className="font-bold text-sm mb-1">✓ Application Submitted to Backend API!</p>
                    <p>Session ID: <span className="font-mono">{submissionResult.sessionId}</span></p>
                    <p>Submitted At: <span className="font-mono">{submissionResult.submittedAt}</span></p>
                    <p className="mt-1 text-[11px] text-emerald-600">Saved to backend: {submissionResult.savedToBackend ? 'Yes (PATCH /api/sessions/:id/form)' : 'Local persistence fallback'}</p>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </TransitionManager>
      </main>

      {/* Clean Footer */}
      <footer className="py-6 border-t border-gray-100 text-center">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
          <span>AuraGen – Self-Healing Generative UI</span>
          <span className="font-mono text-[11px] text-gray-400 bg-gray-100/80 px-2 py-0.5 rounded">
            branch: member-4-renderer
          </span>
        </div>
      </footer>
    </div>
  )
}
