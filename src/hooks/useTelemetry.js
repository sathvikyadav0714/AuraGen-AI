import { useState, useEffect, useRef, useCallback } from 'react'
import { sendTelemetryEvent } from '../lib/api'

/**
 * useTelemetry Hook
 * Tracks user friction signals:
 * - rage_click (rapid clicks on same target)
 * - hesitation (prolonged idle before action)
 * - mouse_movement (high cursor velocity / jitter)
 * - validation_error (form input validation failures)
 * - failed_interaction (failed action attempts)
 * Calculates Cognitive Load Score (0-100) and dispatches events to backend
 */
export default function useTelemetry(sessionId) {
  const [cognitiveScore, setCognitiveScore] = useState(0)
  const [recentEvents, setRecentEvents] = useState([])

  const lastActivityRef = useRef(Date.now())
  const clickHistoryRef = useRef([])
  const lastMousePosRef = useRef({ x: 0, y: 0, time: Date.now() })
  const throttleTelemetryTimerRef = useRef(null)

  // Dispatches telemetry to backend API and updates local score
  const emitTelemetry = useCallback((eventType, field = null, deltaScore = 5) => {
    setCognitiveScore(prev => {
      const newScore = Math.min(100, Math.max(0, prev + deltaScore))
      // Send to backend
      if (sessionId) {
        sendTelemetryEvent(sessionId, {
          eventType,
          field: field || 'general_form',
          cognitiveLoadScore: newScore,
        })
      }
      return newScore
    })

    setRecentEvents(prev => [
      { eventType, field, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ])
  }, [sessionId])

  // 1. Rage Click Detection (3+ clicks within 700ms on same element)
  const handleClick = useCallback((e) => {
    const now = Date.now()
    const targetTag = e.target.tagName || 'unknown'
    const targetName = e.target.name || e.target.id || targetTag

    clickHistoryRef.current = clickHistoryRef.current.filter(c => now - c.time < 700)
    clickHistoryRef.current.push({ time: now, target: targetName })

    if (clickHistoryRef.current.length >= 3) {
      const sameTargetClicks = clickHistoryRef.current.filter(c => c.target === targetName).length
      if (sameTargetClicks >= 3) {
        emitTelemetry('rage_click', targetName, 18)
        clickHistoryRef.current = []
      }
    }

    lastActivityRef.current = now
  }, [emitTelemetry])

  // 2. Mouse Movement & Velocity Detection
  const handleMouseMove = useCallback((e) => {
    const now = Date.now()
    const dt = now - lastMousePosRef.current.time
    if (dt > 100) {
      const dx = e.clientX - lastMousePosRef.current.x
      const dy = e.clientY - lastMousePosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const velocity = distance / dt // pixels per ms

      // High jitter velocity indicates frustration
      if (velocity > 3.5) {
        if (!throttleTelemetryTimerRef.current) {
          emitTelemetry('mouse_movement', 'cursor_track', 6)
          throttleTelemetryTimerRef.current = setTimeout(() => {
            throttleTelemetryTimerRef.current = null
          }, 2500)
        }
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now }
      lastActivityRef.current = now
    }
  }, [emitTelemetry])

  // 3. Hesitation Detection (idle > 5 seconds on active form)
  useEffect(() => {
    const hesitationInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current
      if (idleTime > 6000 && idleTime < 25000) {
        emitTelemetry('hesitation', 'form_idle', 10)
        lastActivityRef.current = Date.now() // reset to avoid rapid repeated firing
      }
    }, 3000)

    return () => clearInterval(hesitationInterval)
  }, [emitTelemetry])

  // Bind global event listeners
  useEffect(() => {
    window.addEventListener('click', handleClick)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleClick, handleMouseMove])

  // Public helper to report validation errors
  const recordValidationError = useCallback((field, errorMsg) => {
    emitTelemetry('validation_error', field, 12)
  }, [emitTelemetry])

  // Public helper to report failed interaction
  const recordFailedInteraction = useCallback((field) => {
    emitTelemetry('failed_interaction', field, 14)
  }, [emitTelemetry])

  const resetScore = useCallback(() => {
    setCognitiveScore(0)
  }, [])

  return {
    cognitiveScore,
    setCognitiveScore,
    recentEvents,
    recordValidationError,
    recordFailedInteraction,
    emitTelemetry,
    resetScore,
  }
}
