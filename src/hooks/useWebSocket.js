import { useState, useEffect, useRef, useCallback } from 'react'

const MAX_RETRIES = 5
const BASE_RECONNECT_DELAY = 1500
const PING_INTERVAL = 25000

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

export default function useWebSocket(url = DEFAULT_WS_URL, sessionId = null) {
  const socketRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const pingTimerRef = useRef(null)
  const reconnectCountRef = useRef(0)

  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState('DISCONNECTED')
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const [reconnectCount, setReconnectCount] = useState(0)

  const stopHeartbeat = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current)
      pingTimerRef.current = null
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    pingTimerRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
          socketRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        } catch {
          // ignore transient ping write errors
        }
      }
    }, PING_INTERVAL)
  }, [stopHeartbeat])

  const connect = useCallback(() => {
    // If no sessionId is provided yet, do not attempt invalid connection
    if (!sessionId) {
      setConnectionState('WAITING_SESSION')
      return
    }

    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.onopen = null
      socketRef.current.onmessage = null
      socketRef.current.onclose = null
      socketRef.current.onerror = null
      socketRef.current.close()
      socketRef.current = null
    }

    setConnectionState(reconnectCountRef.current > 0 ? 'RECONNECTING' : 'CONNECTING')

    try {
      const fullUrl = sessionId
        ? (url.includes('?') ? `${url}&sessionId=${sessionId}` : `${url}/?sessionId=${sessionId}`)
        : url;

      const ws = new WebSocket(fullUrl)
      socketRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setConnectionState('CONNECTED')
        setError(null)
        reconnectCountRef.current = 0
        setReconnectCount(0)
        startHeartbeat()
      }

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          // Ignore heartbeat pong messages
          if (parsed.type === 'pong') return

          // Normalize backend messages
          if (parsed.type === 'connection_established') {
            console.info('[WebSocket] Connected to session:', parsed.sessionId)
          }

          setLastMessage(parsed)
        } catch {
          setLastMessage(event.data)
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        stopHeartbeat()

        if (reconnectCountRef.current < MAX_RETRIES) {
          setConnectionState('RECONNECTING')
          // Exponential backoff
          const delay = Math.min(BASE_RECONNECT_DELAY * (2 ** reconnectCountRef.current), 10000)
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current += 1
            setReconnectCount(reconnectCountRef.current)
            connect()
          }, delay)
        } else {
          setConnectionState('DISCONNECTED')
          setError('Backend WebSocket offline. Running in hybrid demo mode.')
        }
      }

      ws.onerror = () => {
        setError('WebSocket network error (is backend running on port 5000?)')
        setConnectionState('ERROR')
      }
    } catch {
      setError('Failed to initialize WebSocket client')
      setConnectionState('ERROR')
    }
  }, [url, sessionId, startHeartbeat, stopHeartbeat])

  useEffect(() => {
    connect()

    return () => {
      stopHeartbeat()
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (socketRef.current) {
        socketRef.current.onopen = null
        socketRef.current.onmessage = null
        socketRef.current.onclose = null
        socketRef.current.onerror = null
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [connect, stopHeartbeat])

  const sendMessage = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data)
      socketRef.current.send(payload)
      return true
    }
    return false
  }, [])

  // Testing & verification helper: simulates incoming WebSocket message
  const simulateServerMessage = useCallback((msg) => {
    setLastMessage(msg)
  }, [])

  return {
    isConnected,
    connectionState,
    lastMessage,
    error,
    sendMessage,
    simulateServerMessage,
    reconnectCount,
    retryConnection: connect,
  }
}
