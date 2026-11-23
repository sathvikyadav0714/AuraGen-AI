/**
 * AuraGen - Backend API Client Service
 * 
 * Handles all HTTP REST communication between the React frontend and Member 2's Express backend.
 * Provides resilient fallback handling so the frontend remains 100% operational in standalone mode.
 * 
 * Target Endpoints:
 * - GET  /api/health            - Health check (Implemented on Member 2 backend)
 * - POST /api/sessions          - Session creation & registration
 * - POST /api/forms/draft       - Auto-save form draft state
 * - GET  /api/forms/draft/:id   - Restore previously saved form draft
 * - POST /api/telemetry         - Behavioral telemetry & friction event ingestion
 * - POST /api/forms/submit      - Final financial loan application submission
 */

import { createTelemetryPayload } from '../utils/telemetryEvents';

// Configurable Base URL via Vite environment variables with localhost:5000 fallback
export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000/api';

const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Universal safe fetch wrapper with timeout and standardized response shape.
 * 
 * @param {string} endpoint - Relative path (e.g. "/forms/submit")
 * @param {RequestInit} [options]
 * @param {number} [timeoutMs]
 * @returns {Promise<{ ok: boolean, status: number, data: any, error: string|null }>}
 */
export async function safeFetch(endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      data = { text };
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
      return {
        ok: false,
        status: response.status,
        data,
        error: errorMessage
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
      error: null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    const message = isAbort 
      ? `Request timed out after ${timeoutMs}ms` 
      : (err.message || 'Network connection failed');
    
    return {
      ok: false,
      status: 0,
      data: null,
      error: message
    };
  }
}

/**
 * 1. Health Check API
 * Checks whether Member 2's Express backend is reachable.
 */
export async function checkBackendHealth() {
  return safeFetch('/health', { method: 'GET' }, 2500);
}

/**
 * 2. Session Creation API (Task 3)
 * Calls POST /api/sessions to register a new user session on the backend.
 * 
 * @param {Object} [metadata]
 * @returns {Promise<{ ok: boolean, sessionId?: string, error?: string }>}
 */
export async function createSessionApi(metadata = {}) {
  const payload = {
    clientTimestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    ...metadata
  };

  const res = await safeFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res.ok && res.data && res.data.sessionId) {
    return { ok: true, sessionId: res.data.sessionId, data: res.data };
  }

  return { ok: false, error: res.error || 'Failed to create session on backend' };
}

/**
 * 3. Form Auto-Save API (Task 1)
 * Sends current form draft to backend via POST /api/forms/draft.
 * 
 * @param {string} sessionId
 * @param {Object} formData
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function saveDraftApi(sessionId, formData) {
  if (!sessionId) {
    return { ok: false, error: 'Session ID is required for cloud auto-save' };
  }

  const payload = {
    sessionId,
    formData,
    updatedAt: new Date().toISOString()
  };

  const res = await safeFetch('/forms/draft', {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId },
    body: JSON.stringify(payload)
  });

  return {
    ok: res.ok,
    status: res.status,
    data: res.data,
    error: res.error
  };
}

/**
 * 4. Restore Form Draft API (Task 1)
 * Retrieves previously saved form draft from backend via GET /api/forms/draft/:sessionId.
 * 
 * @param {string} sessionId
 * @returns {Promise<{ ok: boolean, formData: Object|null, error?: string }>}
 */
export async function loadDraftApi(sessionId) {
  if (!sessionId) {
    return { ok: false, formData: null, error: 'Session ID is required to restore draft' };
  }

  const res = await safeFetch(`/forms/draft/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: { 'X-Session-ID': sessionId }
  });

  if (res.ok && res.data) {
    const formData = res.data.formData || res.data;
    return { ok: true, formData, error: null };
  }

  return { ok: false, formData: null, error: res.error };
}

/**
 * 5. Telemetry Ingestion API (Task 2)
 * Sends detected behavioral friction events to backend via POST /api/telemetry.
 * 
 * @param {string} sessionId
 * @param {Object} rawEvent - Detected friction event (e.g. rage_click, hesitation)
 * @param {number} [cognitiveLoadScore=0]
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendTelemetryEventApi(sessionId, rawEvent, cognitiveLoadScore = 0) {
  const payload = createTelemetryPayload(sessionId, rawEvent, cognitiveLoadScore);

  const res = await safeFetch('/telemetry', {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId || '' },
    body: JSON.stringify(payload)
  }, 3000);

  return {
    ok: res.ok,
    status: res.status,
    data: res.data,
    error: res.error
  };
}

/**
 * 6. Form Submission API (Task 5)
 * Submits the complete financial application to backend via POST /api/forms/submit.
 * 
 * @param {string} sessionId
 * @param {Object} formData
 * @param {Object} context - Form context & cognitive telemetry summary
 * @returns {Promise<{ ok: boolean, applicationRef?: string, data?: any, error?: string }>}
 */
export async function submitFormApi(sessionId, formData, context = {}) {
  const payload = {
    sessionId: sessionId || 'session_standalone',
    formData,
    context,
    submittedAt: new Date().toISOString()
  };

  const res = await safeFetch('/forms/submit', {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId || '' },
    body: JSON.stringify(payload)
  }, 6000);

  if (res.ok) {
    const ref = res.data?.applicationRef || res.data?.id || `AG-${Date.now().toString(36).toUpperCase()}`;
    return {
      ok: true,
      applicationRef: ref,
      data: res.data,
      error: null
    };
  }

  return {
    ok: false,
    applicationRef: null,
    data: res.data,
    error: res.error || 'Backend form submission failed'
  };
}
