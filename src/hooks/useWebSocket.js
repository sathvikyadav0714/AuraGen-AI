import { useState, useEffect, useRef, useCallback } from 'react'

const MAX_RETRIES = 5
const RECONNECT_DELAY = 3000

export default function useWebSocket(url = 'ws://localhost:3000') {
  const socketRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const reconnectCountRef = useRef(0)

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const [error, setError] = useState(null)
  const [reconnectCount, setReconnectCount] = useState(0)

  const connect = useCallback(() => {
    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.onopen = null
      socketRef.current.onmessage = null
      socketRef.current.onclose = null
      socketRef.current.onerror = null
      socketRef.current.close()
    }

    try {
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectCountRef.current = 0
        setReconnectCount(0)
      }

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          setLastMessage(parsed)
        } catch (e) {
          // If not JSON, store raw data
          setLastMessage(event.data)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        // Schedule reconnect if under max retries
        if (reconnectCountRef.current < MAX_RETRIES) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current += 1
            setReconnectCount(reconnectCountRef.current)
            connect()
          }, RECONNECT_DELAY)
        }
      }

      ws.onerror = () => {
        setError('Connection error')
      }
    } catch (e) {
      setError('Failed to create WebSocket connection')
    }
  }, [url])

  useEffect(() => {
    connect()

    return () => {
      // Cleanup on unmount
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
  }, [connect])

  const sendMessage = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { isConnected, lastMessage, error, sendMessage, reconnectCount }
}
