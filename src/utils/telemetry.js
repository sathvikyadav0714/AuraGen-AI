/**
 * AuraGen - Telemetry Utilities & Privacy-Safe Measurement Engine
 * 
 * Enforces strict non-PII behavioral tracking:
 * - Measures interaction dynamics (delays, velocity, counts, element targets)
 * - Never captures typed text or sensitive financial details
 */

export const TELEMETRY_CONFIG = {
  // Sampling rate for mouse movement in milliseconds (throttled for performance)
  SAMPLE_INTERVAL_MS: 50,

  // Thresholds
  INACTIVITY_THRESHOLD_MS: 3000,      // 3 seconds without input indicates idle/hesitation
  FIELD_HESITATION_THRESHOLD_MS: 2000, // 2 seconds delay before first keystroke on a field
  RAGE_CLICK_WINDOW_MS: 600,          // Time window for rapid burst clicks
  RAGE_CLICK_MIN_COUNT: 3,            // 3+ clicks within 600ms = rage click
  RAGE_CLICK_MAX_DISTANCE_PX: 20,     // Clicks must be within 20px radius to count as same spot

  // Telemetry broadcast interval to sync with React UI state
  SNAPSHOT_INTERVAL_MS: 500
};

/**
 * Calculates Euclidean distance between two points (px)
 */
export function calculateDistance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates velocity in pixels per millisecond (px/ms)
 */
export function calculateVelocity(distancePx, timeDeltaMs) {
  if (timeDeltaMs <= 0) return 0;
  return Number((distancePx / timeDeltaMs).toFixed(3));
}

/**
 * Extracts privacy-safe element identifier for telemetry (never extracts input value)
 */
export function getSafeElementId(element) {
  if (!element) return 'unknown';

  // Check data attribute first
  const fieldName = element.getAttribute('data-telemetry-field');
  if (fieldName) return fieldName;

  // Fallbacks: name, id, or tag
  return element.name || element.id || element.tagName.toLowerCase();
}

/**
 * Formats milliseconds into human-readable seconds (e.g. 2400ms -> "2.4s")
 */
export function formatDuration(ms) {
  if (!ms || ms < 0) return '0.0s';
  return `${(ms / 1000).toFixed(1)}s`;
}
