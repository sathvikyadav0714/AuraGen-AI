/**
 * AuraGen - Telemetry Utilities & Kinematic Movement Measurement Engine
 * 
 * Enforces strict non-PII behavioral tracking:
 * - Measures interaction dynamics (delays, velocity, acceleration, path efficiency)
 * - Detects erratic mouse wandering and purposeful trajectories
 * - Never captures typed text or sensitive financial details
 */

export const TELEMETRY_CONFIG = {
  // Sampling rate for mouse movement in milliseconds (throttled for performance)
  SAMPLE_INTERVAL_MS: 40,

  // Moving average buffer size for velocity smoothing
  VELOCITY_BUFFER_SIZE: 8,

  // Thresholds
  INACTIVITY_THRESHOLD_MS: 3000,      // 3 seconds without input indicates idle/hesitation
  FIELD_HESITATION_THRESHOLD_MS: 2000, // 2 seconds delay before first keystroke on a field
  RAGE_CLICK_WINDOW_MS: 600,          // Time window for rapid burst clicks
  RAGE_CLICK_MIN_COUNT: 3,            // 3+ clicks within 600ms = rage click
  RAGE_CLICK_MAX_DISTANCE_PX: 20,     // Clicks must be within 20px radius to count as same spot
  ERRATIC_ACCELERATION_THRESHOLD: 0.08, // px/ms^2 indicating erratic sudden jerks

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
 * Calculates acceleration in pixels per millisecond squared (px/ms^2)
 */
export function calculateAcceleration(currentVelocity, previousVelocity, timeDeltaMs) {
  if (timeDeltaMs <= 0) return 0;
  const deltaV = currentVelocity - previousVelocity;
  return Number((deltaV / timeDeltaMs).toFixed(4));
}

/**
 * Computes simple moving average of a numeric array
 */
export function calculateMovingAverage(values = []) {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(3));
}

/**
 * Calculates path efficiency percentage (0–100%)
 * Ratio of net straight displacement to total path length traveled.
 * Higher efficiency (70-100%) = purposeful cursor motion towards an action
 * Low efficiency (<35%) = cursor wandering, searching or hesitation
 */
export function calculatePathEfficiency(startPoint, endPoint, totalDistance) {
  if (!startPoint || !endPoint || totalDistance <= 0) return 100;
  const straightDisplacement = calculateDistance(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
  const ratio = straightDisplacement / totalDistance;
  return Math.min(100, Math.round(ratio * 100));
}

/**
 * Analyzes cursor trajectory for erratic direction reversals
 * Returns an erratic score from 0 (very smooth) to 100 (highly erratic/frustrated)
 * 
 * @param {Array<{ x: number, y: number, time: number }>} points
 * @returns {number} 0-100
 */
export function calculateErraticScore(points = []) {
  if (points.length < 3) return 0;

  let sharpTurns = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    const v1 = { x: pCurr.x - pPrev.x, y: pCurr.y - pPrev.y };
    const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 > 5 && mag2 > 5) {
      const cosAngle = dot / (mag1 * mag2);
      // If angle is sharper than 90 degrees (cosAngle < 0), it's a sharp reversal
      if (cosAngle < -0.1) {
        sharpTurns++;
      }
    }
  }

  const maxPossibleTurns = points.length - 2;
  if (maxPossibleTurns <= 0) return 0;

  const score = Math.round((sharpTurns / maxPossibleTurns) * 100);
  return Math.min(100, score);
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
