/**
 * AuraGen - Client Session Manager
 * 
 * Manages unique user session IDs for tracking behavioral telemetry,
 * auto-saving form drafts, and linking WebSocket connections.
 * 
 * Features:
 * - Session ID persistence across page reloads via sessionStorage.
 * - Integration with backend session creation API (POST /api/sessions).
 * - Automatic resilient fallback to UUID generation if backend is unavailable.
 */

const SESSION_STORAGE_KEY = 'auragen_session_id';
const SESSION_META_KEY = 'auragen_session_metadata';

/**
 * Generates a collision-resistant unique session identifier locally.
 * 
 * @returns {string} e.g. "aura_sess_1700000000000_abc123"
 */
export function generateLocalSessionId() {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  const cryptoPart = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID().substring(0, 8) 
    : Math.random().toString(36).substring(2, 6);
  return `aura_sess_${timestamp}_${randomPart}_${cryptoPart}`;
}

/**
 * Retrieves the currently active session ID from sessionStorage.
 * 
 * @returns {string|null}
 */
export function getSessionId() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) || null;
    }
  } catch (err) {
    console.warn('AuraGen SessionManager: Unable to read session ID from storage:', err);
  }
  return null;
}

/**
 * Retrieves full session metadata (source, createdAt, sessionId).
 * 
 * @returns {Object|null}
 */
export function getSessionMetadata() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = sessionStorage.getItem(SESSION_META_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn('AuraGen SessionManager: Unable to read session metadata:', err);
  }
  return null;
}

/**
 * Stores a session ID and its origin metadata.
 * 
 * @param {string} sessionId 
 * @param {'backend'|'local_fallback'} origin 
 */
export function setStoredSession(sessionId, origin = 'local_fallback') {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      const meta = {
        sessionId,
        origin,
        createdAt: new Date().toISOString()
      };
      sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
      return meta;
    }
  } catch (err) {
    console.warn('AuraGen SessionManager: Unable to persist session to storage:', err);
  }
  return { sessionId, origin, createdAt: new Date().toISOString() };
}

/**
 * Clears current session from storage.
 */
export function clearSession() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_META_KEY);
    }
  } catch (err) {
    console.warn('AuraGen SessionManager: Unable to clear session storage:', err);
  }
}

/**
 * Initializes or restores an active session.
 * 
 * 1. Checks if a session already exists in sessionStorage.
 * 2. If not, attempts to call backend createSession API.
 * 3. Falls back smoothly to local ID generation if backend is offline or unavailable.
 * 
 * @param {Function} [createSessionApiFn] - Optional backend API function
 * @returns {Promise<{ sessionId: string, origin: string, isNew: boolean }>}
 */
export async function initSession(createSessionApiFn = null) {
  const existingId = getSessionId();
  if (existingId) {
    const meta = getSessionMetadata();
    return {
      sessionId: existingId,
      origin: meta?.origin || 'cached',
      isNew: false
    };
  }

  // Attempt backend creation if API function provided
  if (typeof createSessionApiFn === 'function') {
    try {
      const res = await createSessionApiFn();
      if (res && res.sessionId) {
        setStoredSession(res.sessionId, 'backend');
        return {
          sessionId: res.sessionId,
          origin: 'backend',
          isNew: true
        };
      }
    } catch (err) {
      console.warn('AuraGen SessionManager: Backend session creation failed, using resilient local fallback:', err.message);
    }
  }

  // Resilient fallback to locally generated session ID
  const localId = generateLocalSessionId();
  setStoredSession(localId, 'local_fallback');
  return {
    sessionId: localId,
    origin: 'local_fallback',
    isNew: true
  };
}
