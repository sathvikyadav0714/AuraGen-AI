/**
 * AuraGen - Telemetry Event Contract & Event Normalizer
 * 
 * Maps frontend friction and interaction events to canonical backend event types.
 * Enforces Non-PII telemetry transmission (interaction kinetics only, never raw input values).
 */

/**
 * Standard backend-supported event types conforming to AuraGen architecture.
 */
export const BACKEND_EVENT_TYPES = {
  RAGE_CLICK: 'RAGE_CLICK',
  DEAD_CLICK: 'DEAD_CLICK',
  HESITATION: 'HESITATION',
  FIELD_ABANDONMENT: 'FIELD_ABANDONMENT',
  INACTIVITY_STARTED: 'INACTIVITY_STARTED',
  INACTIVITY_ENDED: 'INACTIVITY_ENDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  COGNITIVE_LOAD_UPDATE: 'COGNITIVE_LOAD_UPDATE',
  FORM_INTERACTION: 'FORM_INTERACTION'
};

/**
 * Mapping table from frontend event names to backend-supported event types.
 * Corrects any mismatched or legacy names.
 */
const FRONTEND_TO_BACKEND_EVENT_MAP = {
  // Rage & Clicks
  'rage_click': BACKEND_EVENT_TYPES.RAGE_CLICK,
  'rapid_clicks': BACKEND_EVENT_TYPES.RAGE_CLICK,
  'click_burst': BACKEND_EVENT_TYPES.RAGE_CLICK,
  'dead_click': BACKEND_EVENT_TYPES.DEAD_CLICK,
  'disabled_click': BACKEND_EVENT_TYPES.DEAD_CLICK,

  // Hesitation & Cognitive pauses
  'hesitation': BACKEND_EVENT_TYPES.HESITATION,
  'input_hesitation': BACKEND_EVENT_TYPES.HESITATION,
  'hesitation_abandoned': BACKEND_EVENT_TYPES.FIELD_ABANDONMENT,
  'field_abandoned': BACKEND_EVENT_TYPES.FIELD_ABANDONMENT,
  'abandonment': BACKEND_EVENT_TYPES.FIELD_ABANDONMENT,

  // Inactivity & Idling
  'inactivity_started': BACKEND_EVENT_TYPES.INACTIVITY_STARTED,
  'inactivity': BACKEND_EVENT_TYPES.INACTIVITY_STARTED,
  'user_idle': BACKEND_EVENT_TYPES.INACTIVITY_STARTED,
  'inactivity_ended': BACKEND_EVENT_TYPES.INACTIVITY_ENDED,
  'resumed': BACKEND_EVENT_TYPES.INACTIVITY_ENDED,
  'activity_resumed': BACKEND_EVENT_TYPES.INACTIVITY_ENDED,

  // Validation
  'validation_error': BACKEND_EVENT_TYPES.VALIDATION_ERROR,
  'field_validation_failed': BACKEND_EVENT_TYPES.VALIDATION_ERROR,

  // Cognitive Score
  'cognitive_load_update': BACKEND_EVENT_TYPES.COGNITIVE_LOAD_UPDATE,
  'score_update': BACKEND_EVENT_TYPES.COGNITIVE_LOAD_UPDATE
};

/**
 * Normalizes any frontend event type into the canonical backend-supported event name.
 * 
 * @param {string} frontendEventType
 * @returns {string} Normalized backend event type
 */
export function toBackendEventType(frontendEventType) {
  if (!frontendEventType) return BACKEND_EVENT_TYPES.FORM_INTERACTION;

  const key = String(frontendEventType).trim().toLowerCase();
  if (FRONTEND_TO_BACKEND_EVENT_MAP[key]) {
    return FRONTEND_TO_BACKEND_EVENT_MAP[key];
  }

  // Already screaming snake case or matches backend values directly
  const upperKey = String(frontendEventType).trim().toUpperCase();
  if (Object.values(BACKEND_EVENT_TYPES).includes(upperKey)) {
    return upperKey;
  }

  return upperKey || BACKEND_EVENT_TYPES.FORM_INTERACTION;
}

/**
 * Constructs a secure, non-PII telemetry payload ready for backend ingestion.
 * Ensures NO user-entered values (names, passwords, phone numbers) are ever transmitted.
 * 
 * @param {string} sessionId - Active session ID
 * @param {Object} event - Raw frontend friction event
 * @param {number} [cognitiveLoadScore=0] - Current real-time cognitive score
 * @returns {Object} Structured telemetry payload
 */
export function createTelemetryPayload(sessionId, event = {}, cognitiveLoadScore = 0) {
  const backendEventType = toBackendEventType(event.type);

  // Extract safe metrics without PII
  const safeTarget = event.target || event.field || 'document';
  const durationMs = event.durationMs || event.idleDurationMs || event.pauseDurationMs || 0;
  const clicks = event.clicksInBurst || event.clickCount || (event.type === 'dead_click' ? 1 : 0);
  const frequency = event.frequency || 0;
  const severity = event.severity || (cognitiveLoadScore > 65 ? 'high' : cognitiveLoadScore > 35 ? 'medium' : 'low');

  return {
    sessionId: sessionId || 'anonymous_session',
    eventType: backendEventType,
    target: String(safeTarget).replace(/[^a-zA-Z0-9_-]/g, ''), // Safe identifier
    timestamp: event.timestamp || Date.now(),
    cognitiveLoadScore: Number(cognitiveLoadScore) || 0,
    metrics: {
      durationMs: Number(durationMs),
      clicks: Number(clicks),
      frequency: Number(frequency),
      severity: String(severity)
    },
    context: {
      errorMessage: event.errorMessage ? String(event.errorMessage).slice(0, 200) : null,
      clientUrl: typeof window !== 'undefined' ? window.location.pathname : '/'
    }
  };
}
