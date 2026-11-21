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

/**
 * Evaluates whether a given focus duration qualifies as cognitive hesitation
 */
export function isFieldHesitant(focusDurationMs, thresholdMs = TELEMETRY_CONFIG.FIELD_HESITATION_THRESHOLD_MS) {
  if (typeof focusDurationMs !== 'number' || focusDurationMs < 0) return false;
  return focusDurationMs >= thresholdMs;
}

/**
 * Calculates a normalized hesitation index (0–100) reflecting cognitive friction from input hesitation
 * 
 * @param {Object} fieldHesitations - Map of field names to duration or stat objects
 * @returns {number} 0-100 score
 */
export function calculateHesitationIndex(fieldHesitations = {}) {
  const fields = Object.keys(fieldHesitations);
  if (!fields.length) return 0;

  let totalHesitationMs = 0;
  for (const field of fields) {
    const val = fieldHesitations[field];
    const duration = typeof val === 'number' ? val : (val?.totalDurationMs || 0);
    totalHesitationMs += Math.max(0, duration);
  }

  // 10,000ms (10 seconds) of cumulative hesitation maps to a max friction penalty of 100
  const score = Math.round((totalHesitationMs / 10000) * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * Produces a human-readable summary of hesitant fields sorted by delay duration
 * 
 * @param {Object} fieldHesitations 
 * @returns {string} e.g. "loanAmount (3.2s), annualIncome (2.1s)" or "None"
 */
export function formatHesitationSummary(fieldHesitations = {}) {
  const entries = Object.entries(fieldHesitations)
    .map(([field, val]) => {
      const duration = typeof val === 'number' ? val : (val?.totalDurationMs || 0);
      return { field, duration };
    })
    .filter((item) => item.duration > 0)
    .sort((a, b) => b.duration - a.duration);

  if (!entries.length) return 'None';
  return entries.map((e) => `${e.field} (${formatDuration(e.duration)})`).join(', ');
}

/**
 * Evaluates user inactivity patterns across the session
 * 
 * @param {number} totalInactivityMs - Total accumulated idle time
 * @param {number} sessionDurationMs - Total session duration
 * @param {number} [inactivityPeriodsCount=0] - Number of distinct idle pauses
 * @returns {{ idleRatio: number, severity: 'normal' | 'moderate' | 'high', isExcessive: boolean, averageIdlePeriodMs: number }}
 */
export function analyzeInactivityPattern(totalInactivityMs = 0, sessionDurationMs = 0, inactivityPeriodsCount = 0) {
  if (sessionDurationMs <= 0 || totalInactivityMs <= 0) {
    return {
      idleRatio: 0,
      severity: 'normal',
      isExcessive: false,
      averageIdlePeriodMs: 0
    };
  }

  const idleRatio = Math.min(100, Math.round((totalInactivityMs / sessionDurationMs) * 100));
  const averageIdlePeriodMs = inactivityPeriodsCount > 0 ? Math.round(totalInactivityMs / inactivityPeriodsCount) : totalInactivityMs;

  let severity = 'normal';
  let isExcessive = false;

  if (idleRatio >= 50) {
    severity = 'high';
    isExcessive = true;
  } else if (idleRatio >= 25) {
    severity = 'moderate';
    isExcessive = false;
  }

  return {
    idleRatio,
    severity,
    isExcessive,
    averageIdlePeriodMs
  };
}

/**
 * Detects whether an element or click target represents a disabled / dead element
 * 
 * @param {Element|null} element
 * @returns {boolean}
 */
export function isElementDisabled(element) {
  if (!element || typeof element.getAttribute !== 'function') return false;
  return (
    element.disabled === true ||
    element.getAttribute('aria-disabled') === 'true' ||
    element.classList?.contains('disabled') ||
    Boolean(element.closest && element.closest('[disabled], [aria-disabled="true"], .disabled'))
  );
}

/**
 * Calculates click frequency in clicks per second (clicks/s)
 * 
 * @param {number} clickCount
 * @param {number} durationMs
 * @returns {number} clicks per second
 */
export function calculateClickFrequency(clickCount, durationMs) {
  if (!clickCount || clickCount <= 1 || !durationMs || durationMs <= 0) return 0;
  return Number(((clickCount / durationMs) * 1000).toFixed(1));
}

/**
 * Evaluates a sequence of rapid clicks to detect rage bursts and assess severity
 * 
 * @param {Array<{ x: number, y: number, time: number, target: string }>} clicks
 * @param {number} [windowMs=TELEMETRY_CONFIG.RAGE_CLICK_WINDOW_MS]
 * @param {number} [maxDistancePx=TELEMETRY_CONFIG.RAGE_CLICK_MAX_DISTANCE_PX]
 * @returns {{ isRageClick: boolean, clicksInBurst: number, durationMs: number, frequency: number, severity: 'none' | 'mild' | 'moderate' | 'severe', radiusPx: number }}
 */
export function analyzeClickBurst(
  clicks = [],
  windowMs = TELEMETRY_CONFIG.RAGE_CLICK_WINDOW_MS,
  maxDistancePx = TELEMETRY_CONFIG.RAGE_CLICK_MAX_DISTANCE_PX
) {
  if (clicks.length < TELEMETRY_CONFIG.RAGE_CLICK_MIN_COUNT) {
    return {
      isRageClick: false,
      clicksInBurst: clicks.length,
      durationMs: 0,
      frequency: 0,
      severity: 'none',
      radiusPx: 0
    };
  }

  const first = clicks[0];
  const last = clicks[clicks.length - 1];
  const durationMs = last.time - first.time;

  // Measure max distance from the initial click anchor point
  let maxDisplacement = 0;
  for (const c of clicks) {
    const d = calculateDistance(first.x, first.y, c.x, c.y);
    if (d > maxDisplacement) maxDisplacement = d;
  }

  const isRageClick = durationMs <= windowMs && maxDisplacement <= maxDistancePx;
  const frequency = durationMs > 0 ? calculateClickFrequency(clicks.length, durationMs) : 0;

  let severity = 'none';
  if (isRageClick) {
    if (clicks.length >= 5 || frequency >= 8.0) {
      severity = 'severe';
    } else if (clicks.length >= 4 || frequency >= 5.0) {
      severity = 'moderate';
    } else {
      severity = 'mild';
    }
  }

  return {
    isRageClick,
    clicksInBurst: clicks.length,
    durationMs,
    frequency,
    severity,
    radiusPx: Math.round(maxDisplacement)
  };
}

/**
 * Calculates a normalized rage score (0–100) reflecting user clicking frustration
 * 
 * @param {number} rageClickCount
 * @param {number} [deadClickCount=0]
 * @returns {number} 0-100 score
 */
export function calculateRageScore(rageClickCount = 0, deadClickCount = 0) {
  // Each rage click adds 25 points, each dead click adds 10 points
  const rawScore = (rageClickCount * 25) + (deadClickCount * 10);
  return Math.min(100, Math.max(0, rawScore));
}
