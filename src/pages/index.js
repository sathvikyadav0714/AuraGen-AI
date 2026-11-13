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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Head><title>AuraGen – Self-Healing UI</title></Head>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-gray-800 text-lg">AuraGen</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Self-Healing UI</span>
          </div>
          {/* WS status dot */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-gray-500">{isConnected ? 'Connected' : 'Demo Mode'}</span>
            {/* Demo trigger button when not connected */}
            {!isConnected && mode === 'original' && (
              <button
                onClick={() => {
                  setMode('loading')
                  setTimeout(() => {
                    setUiSchema(DEMO_SCHEMA)
                    setMode('wizard')
                  }, 2000)
                }}
                className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              >
                🧪 Simulate High Friction
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <TransitionManager mode={mode} cognitiveScore={cognitiveScore}>
          <AnimatePresence mode="wait">
            {(mode === 'original') && (
              // Placeholder for Member 1's FinancialForm - shows a card explaining integration
              <div key="original" className="card max-w-2xl mx-auto text-center py-12">
                <div className="text-5xl mb-4">📋</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Financial Application Form</h1>
                <p className="text-gray-500 mb-6">Member 1's FinancialForm component integrates here.</p>
                <p className="text-sm text-gray-400">Click "Simulate High Friction" in the header to test the AI transformation →</p>
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
                    alert('Application submitted! Data: ' + JSON.stringify(data, null, 2))
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

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        AuraGen Member 4 – Dynamic UI Renderer | Branch: member-4-renderer
      </footer>
    </div>
  )
}
