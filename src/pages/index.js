import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { AnimatePresence } from 'framer-motion'
import TransitionManager from '../components/TransitionManager'
import DynamicRenderer from '../components/DynamicRenderer'
import useWebSocket from '../hooks/useWebSocket'

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
        { type: 'NumberInput', id: 'annualIncome', name: 'annualIncome', label: 'Annual Income (₹)', placeholder: 'e.g. 500000', required: true },
        { type: 'NumberInput', id: 'loanAmount', name: 'loanAmount', label: 'Loan Amount Needed (₹)', placeholder: 'e.g. 100000', required: true }
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
  const [mode, setMode] = useState('original')
  const [preservedFormData, setPreservedFormData] = useState({})
  const [uiSchema, setUiSchema] = useState(null)
  const [cognitiveScore, setCognitiveScore] = useState(0)
  const [demoMode, setDemoMode] = useState(true)

  const { isConnected, lastMessage, error, sendMessage, reconnectCount } = useWebSocket('ws://localhost:3000')

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'cognitive_load_update') {
      setCognitiveScore(lastMessage.score)
    } else if (lastMessage.type === 'ui_generation_started') {
      setMode('loading')
    } else if (lastMessage.type === 'ui_generated') {
      setUiSchema(lastMessage.schema)
      setPreservedFormData(lastMessage.preservedData || {})
      setMode('wizard')
    } else if (lastMessage.type === 'ui_generation_failed') {
      setMode('original')
    }
  }, [lastMessage])

  // Update demo mode based on connection status
  useEffect(() => {
    setDemoMode(!isConnected)
  }, [isConnected])

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
            {!isConnected && mode === 'original' && (
              <button
                onClick={() => {
                  setMode('loading')
                  setTimeout(() => {
                    setUiSchema(DEMO_SCHEMA)
                    setMode('wizard')
                  }, 1800)
                }}
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
              <div key="original" className="max-w-xl mx-auto">
                <div className="card text-center py-14 px-8 border border-gray-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] rounded-3xl bg-white">
                  <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-2xl shadow-inner">
                    📋
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
                    Standard Financial Application
                  </h1>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
                    Member 1's friction-monitored form component mounts here. Telemetry tracking will measure cognitive load in real-time.
                  </p>

                  <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 text-left mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-700">Preview Transformation</span>
                      <span className="text-[10px] font-medium bg-white text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">Demo</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-normal mb-3">
                      Trigger the automated transformation to see AuraGen self-heal this form into a clean conversational wizard.
                    </p>
                    <button
                      onClick={() => {
                        setMode('loading')
                        setTimeout(() => {
                          setUiSchema(DEMO_SCHEMA)
                          setMode('wizard')
                        }, 1800)
                      }}
                      className="btn-primary w-full text-xs py-2.5"
                    >
                      Trigger UI Self-Healing →
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    AST validation & allowed component registry active.
                  </p>
                </div>
              </div>
            )}

            {(mode === 'loading' || mode === 'wizard') && (
              <div key="wizard">
                <DynamicRenderer
                  uiSchema={mode === 'wizard' ? uiSchema : null}
                  isLoading={mode === 'loading'}
                  preservedData={preservedFormData}
                  onComplete={(data) => {
                    console.log('Form completed:', data)
                    alert('Application successfully submitted!\n\nData:\n' + JSON.stringify(data, null, 2))
                  }}
                  onCancel={() => {
                    setMode('original')
                    setUiSchema(null)
                  }}
                />
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
