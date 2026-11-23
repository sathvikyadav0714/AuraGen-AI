/**
 * AuraGen - Cognitive Load Scoring Algorithm Engine (Day 11 Deliverable)
 * 
 * Computes real-time composite cognitive friction index (0–100 scale)
 * based on non-PII kinematic and behavioral telemetry:
 * - Hesitation dwell pauses
 * - Rage click bursts & dead clicks
 * - Repeated validation failures
 * - Cursor path trajectory wandering & erratic direction reversals
 * - User inactivity states
 * 
 * @module cognitiveScore
 */

export const COGNITIVE_CONFIG = {
  BASELINE_SCORE: 10,
  MIN_SCORE: 5,
  MAX_SCORE: 100,

  // Weight multipliers for distinct cognitive friction modalities
  WEIGHTS: {
    HESITATION: 12,           // Cognitive pause before typing or field abandonment
    RAGE_CLICK: 25,           // Severe user frustration and repeated hammering
    DEAD_CLICK: 8,            // Clicking unclickable or disabled targets
    VALIDATION_ERROR: 15,     // Rule mismatch friction
    INACTIVITY: 12,           // Extended cognitive stall
    LOW_EFFICIENCY_PENALTY: 10, // Cursor searching/wandering (efficiency < 40%)
    ERRATIC_MOVEMENT: 0.15    // Sharp jittery reversals penalty
  },

  // Cognitive State Classification Thresholds
  THRESHOLDS: {
    OPTIMAL_MAX: 34,    // 5 - 34: Optimal Focus (Normal Flow)
    MODERATE_MAX: 64,   // 35 - 64: Moderate Cognitive Load (Monitoring)
    HIGH_TRIGGER: 65    // 65 - 100: High Friction (Triggers Generative UI)
  }
};

/**
 * Calculates normalized cognitive load score (0–100 scale)
 * 
 * @param {Object} [telemetry={}] - Active telemetry snapshot from useTelemetry
 * @returns {number} Integer cognitive score between 5 and 100
 */
export function calculateCognitiveScore(telemetry = {}) {
  const data = telemetry || {};
  let score = COGNITIVE_CONFIG.BASELINE_SCORE;

  // 1. Hesitation Events (delays > 2000ms)
  const hesitationCount = Number(data.hesitationEventsCount) || 0;
  score += hesitationCount * COGNITIVE_CONFIG.WEIGHTS.HESITATION;

  // 2. Rage Click Bursts (>= 3 clicks within 600ms)
  const rageCount = Number(data.rageClickCount) || 0;
  score += rageCount * COGNITIVE_CONFIG.WEIGHTS.RAGE_CLICK;

  // 3. Dead Clicks on disabled or non-interactive elements
  const deadCount = Number(data.deadClickCount) || 0;
  score += deadCount * COGNITIVE_CONFIG.WEIGHTS.DEAD_CLICK;

  // 4. Form Validation Errors encountered
  const errorCount = Number(data.validationErrorCount) || 0;
  score += errorCount * COGNITIVE_CONFIG.WEIGHTS.VALIDATION_ERROR;

  // 5. Cursor Trajectory Efficiency (< 40% indicates wandering search pattern)
  const efficiency = Number(data.pathEfficiency);
  if (!Number.isNaN(efficiency) && efficiency < 40 && (Number(data.totalDistanceMoved) || 0) > 100) {
    score += COGNITIVE_CONFIG.WEIGHTS.LOW_EFFICIENCY_PENALTY;
  }

  // 6. Erratic Movement Penalty (erratic score > 50)
  const erraticScore = Number(data.erraticMovementScore) || 0;
  if (erraticScore > 50) {
    score += Math.round((erraticScore - 50) * COGNITIVE_CONFIG.WEIGHTS.ERRATIC_MOVEMENT);
  }

  // 7. Active Inactivity Pause
  if (Boolean(data.isCurrentlyInactive)) {
    score += COGNITIVE_CONFIG.WEIGHTS.INACTIVITY;
  }

  // Clamp strictly to [MIN_SCORE, MAX_SCORE]
  return Math.min(COGNITIVE_CONFIG.MAX_SCORE, Math.max(COGNITIVE_CONFIG.MIN_SCORE, Math.round(score)));
}

/**
 * Computes detailed friction breakdown explaining the score composition.
 * Used for Member 2 & 3 AI diagnosis contracts.
 * 
 * @param {Object} [telemetry={}]
 * @returns {Object} Detailed component contribution map
 */
export function getCognitiveScoreBreakdown(telemetry = {}) {
  const data = telemetry || {};
  const hesitationCount = Number(data.hesitationEventsCount) || 0;
  const rageCount = Number(data.rageClickCount) || 0;
  const deadCount = Number(data.deadClickCount) || 0;
  const errorCount = Number(data.validationErrorCount) || 0;
  const efficiency = Number(data.pathEfficiency);
  const erraticScore = Number(data.erraticMovementScore) || 0;
  const isInactive = Boolean(data.isCurrentlyInactive);

  const hesitationPts = hesitationCount * COGNITIVE_CONFIG.WEIGHTS.HESITATION;
  const ragePts = rageCount * COGNITIVE_CONFIG.WEIGHTS.RAGE_CLICK;
  const deadPts = deadCount * COGNITIVE_CONFIG.WEIGHTS.DEAD_CLICK;
  const errorPts = errorCount * COGNITIVE_CONFIG.WEIGHTS.VALIDATION_ERROR;
  const efficiencyPts = (!Number.isNaN(efficiency) && efficiency < 40 && (Number(telemetry.totalDistanceMoved) || 0) > 100)
    ? COGNITIVE_CONFIG.WEIGHTS.LOW_EFFICIENCY_PENALTY
    : 0;
  const erraticPts = erraticScore > 50
    ? Math.round((erraticScore - 50) * COGNITIVE_CONFIG.WEIGHTS.ERRATIC_MOVEMENT)
    : 0;
  const inactivityPts = isInactive ? COGNITIVE_CONFIG.WEIGHTS.INACTIVITY : 0;

  const rawSum = COGNITIVE_CONFIG.BASELINE_SCORE + hesitationPts + ragePts + deadPts + errorPts + efficiencyPts + erraticPts + inactivityPts;
  const totalScore = Math.min(COGNITIVE_CONFIG.MAX_SCORE, Math.max(COGNITIVE_CONFIG.MIN_SCORE, Math.round(rawSum)));

  // Identify dominant friction factor
  const factors = [
    { name: 'Rage Clicks', points: ragePts },
    { name: 'Hesitation Pauses', points: hesitationPts },
    { name: 'Validation Errors', points: errorPts },
    { name: 'Dead Clicks', points: deadPts },
    { name: 'Trajectory Wandering', points: efficiencyPts + erraticPts },
    { name: 'Inactivity', points: inactivityPts }
  ].filter(f => f.points > 0);

  factors.sort((a, b) => b.points - a.points);
  const primaryDriver = factors.length > 0 ? factors[0].name : 'None (Baseline)';

  return {
    baseline: COGNITIVE_CONFIG.BASELINE_SCORE,
    hesitationPoints: hesitationPts,
    rageClickPoints: ragePts,
    deadClickPoints: deadPts,
    validationErrorPoints: errorPts,
    efficiencyPenaltyPoints: efficiencyPts,
    erraticPenaltyPoints: erraticPts,
    inactivityPoints: inactivityPts,
    totalScore,
    primaryDriver
  };
}

/**
 * Classifies a cognitive score into presentation metadata
 * 
 * @param {number} score - Score between 0 and 100
 * @returns {Object} UI display properties, badge styles, and AI trigger flag
 */
export function classifyCognitiveLoad(score) {
  const numericScore = Number(score) || COGNITIVE_CONFIG.BASELINE_SCORE;

  if (numericScore >= COGNITIVE_CONFIG.THRESHOLDS.HIGH_TRIGGER) {
    return {
      tier: 'HIGH',
      label: 'High Friction (Generative UI Triggered)',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      barColor: 'from-amber-500 to-rose-500',
      icon: 'alert-triangle',
      shouldTriggerGenerativeUi: true
    };
  }

  if (numericScore > COGNITIVE_CONFIG.THRESHOLDS.OPTIMAL_MAX) {
    return {
      tier: 'MODERATE',
      label: 'Moderate Cognitive Load',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      barColor: 'from-indigo-500 to-amber-500',
      icon: 'clock',
      shouldTriggerGenerativeUi: false
    };
  }

  return {
    tier: 'OPTIMAL',
    label: 'Optimal Focus (Normal Flow)',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    barColor: 'from-emerald-500 to-indigo-500',
    icon: 'check',
    shouldTriggerGenerativeUi: false
  };
}
