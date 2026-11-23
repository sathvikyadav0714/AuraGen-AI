/**
 * AuraGen - Frontend WebSocket Client Hook
 * 
 * Manages real-time bi-directional streaming between the frontend and the backend.
 * 
 * Responsibilities:
 * 1. Connects using backend WebSocket URL (default ws://localhost:5000/ws).
 * 2. Receives generated UI schemas (e.g. { type: 'ui_generated', schema, preservedData }).
 * 3. Handles automatic reconnection with exponential backoff / retry limit (5 retries, 3s interval).
 * 4. Tracks connection health state (connecting, connected, disconnected, reconnectCount).
 * 5. Provides safe sendMessage function for client events.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const MAX_RETRIES = 5;
const RECONNECT_DELAY_MS = 3000;

export const DEFAULT_WS_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL)
  ? import.meta.env.VITE_WS_URL
  : 'ws://localhost:5000';

export default function useWebSocket(url = DEFAULT_WS_URL, options = {}) {
  const { onMessage, autoConnect = true, sessionId = null } = options;

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const isManuallyClosedRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const connect = useCallback(() => {
    // If running in non-browser environment or already connected, skip
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      try {
        socketRef.current.close();
      } catch (e) {
        // Ignore close error
      }
      socketRef.current = null;
    }

    setIsConnecting(true);
    setError(null);

    // Build URL with session query if provided
    let targetUrl = url;
    if (sessionId && !targetUrl.includes('sessionId=')) {
      const sep = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${sep}sessionId=${encodeURIComponent(sessionId)}`;
    }

    try {
      const ws = new WebSocket(targetUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectCountRef.current = 0;
        setReconnectCount(0);

        // Send handshake if sessionId available
        if (sessionId && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'CLIENT_HANDSHAKE',
            sessionId,
            clientRole: 'MEMBER_1_FRONTEND',
            timestamp: Date.now()
          }));
        }
      };

      ws.onmessage = (event) => {
        let parsed = null;
        try {
          parsed = JSON.parse(event.data);
        } catch (e) {
          parsed = { type: 'RAW_TEXT', data: event.data };
        }

        setLastMessage(parsed);
        if (typeof onMessage === 'function') {
          onMessage(parsed);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);

        // Auto-reconnect if not manually closed and under max retries
        if (!isManuallyClosedRef.current && reconnectCountRef.current < MAX_RETRIES) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            setReconnectCount(reconnectCountRef.current);
            connect();
          }, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = (e) => {
        // Silently mark connection state without unhandled exception
        setError('WebSocket server unreachable');
        setIsConnecting(false);
      };
    } catch (e) {
      setError(e.message || 'Failed to establish WebSocket connection');
      setIsConnecting(false);
    }
  }, [url, sessionId, onMessage]);

  useEffect(() => {
    if (autoConnect) {
      isManuallyClosedRef.current = false;
      connect();
    }

    return () => {
      isManuallyClosedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        try {
          socketRef.current.close();
        } catch (e) {
          // Ignore
        }
        socketRef.current = null;
      }
    };
  }, [connect, autoConnect]);

  const sendMessage = useCallback((data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      socketRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  const manualReconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    setReconnectCount(0);
    isManuallyClosedRef.current = false;
    connect();
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    error,
    reconnectCount,
    maxRetries: MAX_RETRIES,
    sendMessage,
    reconnect: manualReconnect
  };
}
