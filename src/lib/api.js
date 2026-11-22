/**
 * api.js - Backend REST API Client for AuraGen
 * Integrates directly with Member 2 (Sathvik) backend services:
 * - Session Management: POST /api/sessions, GET /api/sessions/:id
 * - Form Data Auto-Save: PATCH /api/sessions/:id/form, GET /api/sessions/:id/form
 * - Telemetry & Friction: POST /api/sessions/:id/telemetry
 * - AI Generation Trigger: POST /api/sessions/:id/generate
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const ALLOWED_TELEMETRY_EVENTS = [
  'rage_click',
  'hesitation',
  'validation_error',
  'failed_interaction',
  'mouse_movement',
];

/**
 * Creates a new user session on the backend
 * @returns {Promise<{ sessionId: string }>}
 */
export async function createSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (json.success && json.data?.sessionId) {
      return json.data;
    }
    throw new Error(json.message || 'Failed to create session');
  } catch (err) {
    console.warn('[API] Backend session creation failed, using local fallback:', err.message);
    // Fallback uuid if backend is offline
    const fallbackId = 'f' + Math.random().toString(36).substring(2, 9) + '-4000-8000-' + Date.now().toString(16).slice(-12);
    return { sessionId: fallbackId, isOfflineFallback: true };
  }
}

/**
 * Retrieves an existing session by ID
 * @param {string} sessionId
 */
export async function getSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('[API] Could not fetch session:', err.message);
    return null;
  }
}

/**
 * Auto-saves or updates form data on the backend
 * @param {string} sessionId
 * @param {object} formData
 * @returns {Promise<boolean>}
 */
export async function saveFormData(sessionId, formData) {
  if (!sessionId || !formData || typeof formData !== 'object') return false;

  // Ensure formData only contains valid scalar types (strings, numbers, booleans)
  const sanitized = {};
  for (const [key, value] of Object.entries(formData)) {
    if (value !== null && typeof value === 'object') continue;
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      sanitized[key] = value;
    }
  }

  if (Object.keys(sanitized).length === 0) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/form`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.warn('[API] Form auto-save to backend failed:', err.message);
    return false;
  }
}

/**
 * Retrieves saved form data from the backend
 * @param {string} sessionId
 */
export async function getFormData(sessionId) {
  if (!sessionId) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/form`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.warn('[API] Could not load form data:', err.message);
    return null;
  }
}

/**
 * Sends a telemetry event to the backend
 * Supported eventTypes: "rage_click" | "hesitation" | "validation_error" | "failed_interaction" | "mouse_movement"
 * @param {string} sessionId
 * @param {{ eventType: string, field?: string, cognitiveLoadScore?: number }} payload
 */
export async function sendTelemetryEvent(sessionId, { eventType, field, cognitiveLoadScore }) {
  if (!sessionId || !ALLOWED_TELEMETRY_EVENTS.includes(eventType)) {
    return false;
  }

  const body = { eventType };
  if (field && typeof field === 'string') body.field = field;
  if (typeof cognitiveLoadScore === 'number' && Number.isFinite(cognitiveLoadScore)) {
    body.cognitiveLoadScore = Math.max(0, Math.min(100, Math.round(cognitiveLoadScore)));
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    // Non-blocking telemetry log
    console.debug('[API] Telemetry transmission skipped (backend unreachable):', eventType);
    return false;
  }
}

/**
 * Requests AI generation manually via backend REST endpoint
 * @param {string} sessionId
 */
export async function triggerGenerationRequest(sessionId) {
  if (!sessionId) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('[API] Generation trigger request failed:', err.message);
    return null;
  }
}

/**
 * Submits final form data to backend
 * @param {string} sessionId
 * @param {object} formData
 */
export async function submitFormToBackend(sessionId, formData) {
  // First persist the latest form data to backend
  const saved = await saveFormData(sessionId, formData);
  return {
    success: true,
    savedToBackend: saved,
    submittedAt: new Date().toISOString(),
    sessionId,
  };
}

export default {
  createSession,
  getSession,
  saveFormData,
  getFormData,
  sendTelemetryEvent,
  triggerGenerationRequest,
  submitFormToBackend,
  ALLOWED_TELEMETRY_EVENTS,
};
