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
  const [preservedFormData, setPreservedFormData] = useState({
    fullName: 'Rahul Verma',
    email: 'rahul.verma@example.com',
    annualIncome: '750000',
    loanAmount: '250000',
  })
  const [uiSchema, setUiSchema] = useState(null)
  const [cognitiveScore, setCognitiveScore] = useState(0)
  const [demoMode, setDemoMode] = useState(true)

  const { isConnected, connectionState, lastMessage, error, sendMessage, simulateServerMessage, reconnectCount } = useWebSocket('ws://localhost:3000')

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

  // Trigger transformation with preserved data
  const handleTriggerTransformation = useCallback((simulatedScore = 85) => {
    setCognitiveScore(simulatedScore)
    setMode('loading')
    setTimeout(() => {
      setUiSchema(DEMO_SCHEMA)
      setMode('wizard')
    }, 1600)
  }, [])

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
                      Member 1 Mock
                    </span>
                  </div>

                  <div className="space-y-3.5 mb-6 text-left">
                    <div>
                      <label className="label-text">Full Name</label>
                      <input
                        type="text"
                        className="input-field"
                        value={preservedFormData.fullName || ''}
                        onChange={(e) => setPreservedFormData(p => ({ ...p, fullName: e.target.value }))}
                        placeholder="e.g. Rahul Verma"
                      />
                    </div>
                    <div>
                      <label className="label-text">Email Address</label>
                      <input
                        type="email"
                        className="input-field"
                        value={preservedFormData.email || ''}
                        onChange={(e) => setPreservedFormData(p => ({ ...p, email: e.target.value }))}
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
                          onChange={(e) => setPreservedFormData(p => ({ ...p, annualIncome: e.target.value }))}
                          placeholder="750000"
                        />
                      </div>
                      <div>
                        <label className="label-text">Loan Amount (₹)</label>
                        <input
                          type="number"
                          className="input-field"
                          value={preservedFormData.loanAmount || ''}
                          onChange={(e) => setPreservedFormData(p => ({ ...p, loanAmount: e.target.value }))}
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
                  onStateChange={(updatedData) => setPreservedFormData(prev => ({ ...prev, ...updatedData }))}
                  onComplete={(data) => {
                    console.log('Form completed:', data)
                    alert('Application successfully submitted!\n\nPreserved & Submitted Data:\n' + JSON.stringify(data, null, 2))
                  }}
                  onCancel={() => {
                    setMode('original')
                    setUiSchema(null)
                    setCognitiveScore(0)
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
