import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TELEMETRY_CONFIG,
  calculateDistance,
  calculateVelocity,
  calculateAcceleration,
  calculateMovingAverage,
  calculatePathEfficiency,
  calculateErraticScore,
  isFieldHesitant,
  calculateHesitationIndex,
  analyzeInactivityPattern,
  isElementDisabled,
  calculateClickFrequency,
  analyzeClickBurst,
  calculateRageScore,
  getSafeElementId
} from '../utils/telemetry';

const INITIAL_TELEMETRY_STATE = {
  // Kinematics & Velocity
  cursorVelocity: 0,           // Instantaneous velocity (px/ms)
  averageVelocity: 0,          // Rolling average velocity (px/ms)
  peakVelocity: 0,             // Maximum session velocity (px/ms)
  cursorAcceleration: 0,       // Acceleration (px/ms^2)
  totalDistanceMoved: 0,       // Total pixels traversed
  pathEfficiency: 100,         // Trajectory efficiency (0–100%)
  erraticMovementScore: 0,     // Sharp direction reversal score (0–100)
  movementEventCount: 0,

  // Clicks & Rage Clicks (Day 9 Enhancements)
  totalClickCount: 0,
  rageClickCount: 0,
  deadClickCount: 0,
  rageScore: 0,                // Normalized click frustration score (0–100)
  peakClickFrequency: 0,       // Max clicks per second observed
  lastClickedElement: null,
  rageClickHistory: [],        // [{ target, clicksInBurst, durationMs, frequency, severity, timestamp }]
  targetClickMap: {},          // { [target]: { count, rageCount, deadCount } }

  // Hesitation & Inactivity (Day 8 Deliverables)
  isCurrentlyInactive: false,
  currentInactivityDurationMs: 0,
  totalInactivityDurationMs: 0,
  inactivityPeriodsCount: 0,
  longestInactivityPeriodMs: 0,
  idleAnalysis: {
    idleRatio: 0,
    severity: 'normal',
    isExcessive: false,
    averageIdlePeriodMs: 0
  },
  hesitationEventsCount: 0,
  hesitationIndex: 0,          // Aggregate penalty score (0–100)
  fieldHesitations: {},        // { [field]: { totalDurationMs, count, abandonedCount, lastDurationMs } }
  activeFocusField: null,
  currentFocusDurationMs: 0,

  // Validation Errors
  validationErrorCount: 0,
  validationErrorFields: {},   // { [field]: count }

  // Session Stats
  sessionDurationMs: 0,
  lastActivityTimestamp: Date.now()
};

/**
 * Custom React Hook for Non-Invasive Behavioral Telemetry & Cognitive Friction Tracking
 * 
 * Features:
 * - Day 9: Rage-click burst analyzer & dead click detection
 * - Day 8: Inactivity timer & input hesitation detection
 * - Day 7: Cursor velocity kinematics & path efficiency
 * - Non-PII guarantee (captures interaction dynamics, never input values)
 * 
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether tracking is active
 * @param {Function} [options.onFrictionEvent] - Callback triggered when friction is detected
 */
export default function useTelemetry(options = {}) {
  const { enabled = true, onFrictionEvent } = options;

  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY_STATE);
  const [isTracking] = useState(enabled);

  // Performance Refs
  const sessionStartTimeRef = useRef(Date.now());
  const lastActivityTimeRef = useRef(Date.now());
  const isInactiveRef = useRef(false);
  const accumulatedInactivityMsRef = useRef(0);
  const currentInactivityMsRef = useRef(0);
  const inactivityPeriodsCountRef = useRef(0);
  const longestInactivityPeriodMsRef = useRef(0);

  // Kinematic Movement Tracking Refs
  const lastMousePosRef = useRef({ x: 0, y: 0, time: Date.now() });
  const startTrajectoryPosRef = useRef({ x: 0, y: 0, time: Date.now() });
  const totalDistanceRef = useRef(0);
  const currentVelocityRef = useRef(0);
  const previousVelocityRef = useRef(0);
  const peakVelocityRef = useRef(0);
  const accelerationRef = useRef(0);
  const velocityBufferRef = useRef([]); // Rolling velocity samples for moving average
  const trajectoryPointsRef = useRef([]); // Recent points for erratic turn analysis
  const movementEventsRef = useRef(0);

  // Click & Rage Click Tracking Refs (Day 9)
  const totalClicksRef = useRef(0);
  const recentClicksRef = useRef([]); // Stores [{ x, y, time, target }]
  const rageClicksCountRef = useRef(0);
  const deadClicksCountRef = useRef(0);
  const peakClickFrequencyRef = useRef(0);
  const lastClickedElementRef = useRef(null);
  const rageClickHistoryRef = useRef([]);
  const targetClickMapRef = useRef({});

  // Hesitation Tracking Refs
  const activeFocusFieldRef = useRef(null);
  const focusStartTimeRef = useRef(null);
  const hasTriggeredDwellHesitationRef = useRef(false);
  const fieldHesitationsRef = useRef({});
  const hesitationEventsCountRef = useRef(0);

  // Validation Error Tracking Refs
  const validationErrorsCountRef = useRef(0);
  const validationErrorFieldsRef = useRef({});

  // Helper: Register User Activity & Handle Resumption from Inactivity
  const registerUserActivity = useCallback((now) => {
    if (isInactiveRef.current) {
      const pauseDuration = now - lastActivityTimeRef.current;
      if (pauseDuration > longestInactivityPeriodMsRef.current) {
        longestInactivityPeriodMsRef.current = pauseDuration;
      }
      isInactiveRef.current = false;
      currentInactivityMsRef.current = 0;

      if (onFrictionEvent) {
        onFrictionEvent({
          type: 'inactivity_ended',
          pauseDurationMs: pauseDuration,
          timestamp: now
        });
      }
    }
    lastActivityTimeRef.current = now;
  }, [onFrictionEvent]);

  // 1. Mouse Movement & Kinematic Listener (Throttled)
  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);

    const last = lastMousePosRef.current;
    const timeDelta = now - last.time;

    if (timeDelta >= TELEMETRY_CONFIG.SAMPLE_INTERVAL_MS) {
      const distance = calculateDistance(last.x, last.y, e.clientX, e.clientY);
      const velocity = calculateVelocity(distance, timeDelta);
      const acceleration = calculateAcceleration(velocity, previousVelocityRef.current, timeDelta);

      totalDistanceRef.current += Math.round(distance);
      previousVelocityRef.current = currentVelocityRef.current;
      currentVelocityRef.current = velocity;
      accelerationRef.current = acceleration;
      movementEventsRef.current += 1;

      // Update peak velocity
      if (velocity > peakVelocityRef.current) {
        peakVelocityRef.current = velocity;
      }

      // Rolling velocity buffer for moving average
      velocityBufferRef.current.push(velocity);
      if (velocityBufferRef.current.length > TELEMETRY_CONFIG.VELOCITY_BUFFER_SIZE) {
        velocityBufferRef.current.shift();
      }

      // Rolling trajectory buffer for erratic direction analysis (last 12 points)
      trajectoryPointsRef.current.push({ x: e.clientX, y: e.clientY, time: now });
      if (trajectoryPointsRef.current.length > 12) {
        trajectoryPointsRef.current.shift();
      }

      // Trigger friction event on erratic sudden acceleration jerks
      if (Math.abs(acceleration) >= TELEMETRY_CONFIG.ERRATIC_ACCELERATION_THRESHOLD) {
        if (onFrictionEvent) {
          onFrictionEvent({
            type: 'erratic_movement',
            acceleration,
            velocity,
            timestamp: now
          });
        }
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };
    }
  }, [onFrictionEvent, registerUserActivity]);

  // 2. Click, Rage Click Burst & Dead Click Listener (Day 9 Deliverable)
  const handleClick = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);
    totalClicksRef.current += 1;

    const safeTarget = getSafeElementId(e.target);
    lastClickedElementRef.current = safeTarget;

    // Update target click map
    const existingTargetStats = targetClickMapRef.current[safeTarget] || { count: 0, rageCount: 0, deadCount: 0 };
    targetClickMapRef.current[safeTarget] = {
      ...existingTargetStats,
      count: existingTargetStats.count + 1
    };

    // A. Dead Click Detection (e.g. clicking on disabled button or non-responsive element)
    const isDead = isElementDisabled(e.target);
    if (isDead) {
      deadClicksCountRef.current += 1;
      targetClickMapRef.current[safeTarget].deadCount += 1;

      if (onFrictionEvent) {
        onFrictionEvent({
          type: 'dead_click',
          target: safeTarget,
          timestamp: now
        });
      }
    }

    // B. Rapid Click Burst & Rage Click Detection
    const currentClick = {
      x: e.clientX,
      y: e.clientY,
      time: now,
      target: safeTarget
    };

    // Keep clicks within the rage window
    const windowStart = now - TELEMETRY_CONFIG.RAGE_CLICK_WINDOW_MS;
    const recent = recentClicksRef.current.filter((c) => c.time >= windowStart);
    recent.push(currentClick);
    recentClicksRef.current = recent;

    // Analyze rapid click burst
    const burst = analyzeClickBurst(
      recentClicksRef.current,
      TELEMETRY_CONFIG.RAGE_CLICK_WINDOW_MS,
      TELEMETRY_CONFIG.RAGE_CLICK_MAX_DISTANCE_PX
    );

    if (burst.isRageClick) {
      rageClicksCountRef.current += 1;
      targetClickMapRef.current[safeTarget].rageCount += 1;

      if (burst.frequency > peakClickFrequencyRef.current) {
        peakClickFrequencyRef.current = burst.frequency;
      }

      // Record in history log
      const rageEvent = {
        target: safeTarget,
        clicksInBurst: burst.clicksInBurst,
        durationMs: burst.durationMs,
        frequency: burst.frequency,
        severity: burst.severity,
        radiusPx: burst.radiusPx,
        timestamp: now
      };
      rageClickHistoryRef.current.push(rageEvent);

      // Reset buffer after triggering rage click
      recentClicksRef.current = [];

      if (onFrictionEvent) {
        onFrictionEvent({
          type: 'rage_click',
          target: safeTarget,
          clicksInBurst: burst.clicksInBurst,
          durationMs: burst.durationMs,
          frequency: burst.frequency,
          severity: burst.severity,
          radiusPx: burst.radiusPx,
          timestamp: now
        });
      }
    }
  }, [onFrictionEvent, registerUserActivity]);

  // 3. Scroll Listener
  const handleScroll = useCallback(() => {
    registerUserActivity(Date.now());
  }, [registerUserActivity]);

  // 4. Focus, Hesitation and Abandonment Listeners
  const handleFocusIn = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);

    const fieldId = getSafeElementId(e.target);
    activeFocusFieldRef.current = fieldId;
    focusStartTimeRef.current = now;
    hasTriggeredDwellHesitationRef.current = false;
  }, [registerUserActivity]);

  const handleFocusOut = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);

    // If user focused on a field and left without typing, check abandonment delay
    if (activeFocusFieldRef.current && focusStartTimeRef.current) {
      const field = activeFocusFieldRef.current;
      const abandonmentDelay = now - focusStartTimeRef.current;

      if (!hasTriggeredDwellHesitationRef.current && isFieldHesitant(abandonmentDelay, TELEMETRY_CONFIG.FIELD_HESITATION_THRESHOLD_MS)) {
        hesitationEventsCountRef.current += 1;
        const currentStats = fieldHesitationsRef.current[field] || {
          totalDurationMs: 0,
          count: 0,
          abandonedCount: 0,
          lastDurationMs: 0
        };

        fieldHesitationsRef.current = {
          ...fieldHesitationsRef.current,
          [field]: {
            totalDurationMs: currentStats.totalDurationMs + abandonmentDelay,
            count: currentStats.count + 1,
            abandonedCount: currentStats.abandonedCount + 1,
            lastDurationMs: abandonmentDelay
          }
        };

        if (onFrictionEvent) {
          onFrictionEvent({
            type: 'hesitation_abandoned',
            target: field,
            durationMs: abandonmentDelay,
            timestamp: now
          });
        }
      }
    }

    activeFocusFieldRef.current = null;
    focusStartTimeRef.current = null;
    hasTriggeredDwellHesitationRef.current = false;
  }, [onFrictionEvent, registerUserActivity]);

  const handleKeyDown = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);

    // Check hesitation before first keystroke in the currently focused field
    if (activeFocusFieldRef.current && focusStartTimeRef.current) {
      const field = activeFocusFieldRef.current;
      const hesitation = now - focusStartTimeRef.current;

      // Record hesitation if threshold exceeded and dwell hesitation hasn't already fired
      if (!hasTriggeredDwellHesitationRef.current && isFieldHesitant(hesitation, TELEMETRY_CONFIG.FIELD_HESITATION_THRESHOLD_MS)) {
        hasTriggeredDwellHesitationRef.current = true;
        hesitationEventsCountRef.current += 1;
        const currentStats = fieldHesitationsRef.current[field] || {
          totalDurationMs: 0,
          count: 0,
          abandonedCount: 0,
          lastDurationMs: 0
        };

        fieldHesitationsRef.current = {
          ...fieldHesitationsRef.current,
          [field]: {
            totalDurationMs: currentStats.totalDurationMs + hesitation,
            count: currentStats.count + 1,
            abandonedCount: currentStats.abandonedCount,
            lastDurationMs: hesitation
          }
        };

        if (onFrictionEvent) {
          onFrictionEvent({
            type: 'hesitation',
            target: field,
            durationMs: hesitation,
            timestamp: now
          });
        }
      }

      // Reset so subsequent typing in the same field focus does not re-trigger hesitation
      focusStartTimeRef.current = null;
    }
  }, [onFrictionEvent, registerUserActivity]);

  // 5. Record Form Validation Error (Callable externally)
  const recordValidationError = useCallback((field, errorMessage) => {
    validationErrorsCountRef.current += 1;
    validationErrorFieldsRef.current = {
      ...validationErrorFieldsRef.current,
      [field]: (validationErrorFieldsRef.current[field] || 0) + 1
    };

    if (onFrictionEvent) {
      onFrictionEvent({
        type: 'validation_error',
        target: field,
        errorMessage,
        timestamp: Date.now()
      });
    }
  }, [onFrictionEvent]);

  // 6. Reset All Telemetry
  const resetTelemetry = useCallback(() => {
    const now = Date.now();
    sessionStartTimeRef.current = now;
    lastActivityTimeRef.current = now;
    isInactiveRef.current = false;
    accumulatedInactivityMsRef.current = 0;
    currentInactivityMsRef.current = 0;
    inactivityPeriodsCountRef.current = 0;
    longestInactivityPeriodMsRef.current = 0;

    totalDistanceRef.current = 0;
    currentVelocityRef.current = 0;
    previousVelocityRef.current = 0;
    peakVelocityRef.current = 0;
    accelerationRef.current = 0;
    velocityBufferRef.current = [];
    trajectoryPointsRef.current = [];
    movementEventsRef.current = 0;

    totalClicksRef.current = 0;
    recentClicksRef.current = [];
    rageClicksCountRef.current = 0;
    deadClicksCountRef.current = 0;
    peakClickFrequencyRef.current = 0;
    lastClickedElementRef.current = null;
    rageClickHistoryRef.current = [];
    targetClickMapRef.current = {};

    activeFocusFieldRef.current = null;
    focusStartTimeRef.current = null;
    hasTriggeredDwellHesitationRef.current = false;
    fieldHesitationsRef.current = {};
    hesitationEventsCountRef.current = 0;

    validationErrorsCountRef.current = 0;
    validationErrorFieldsRef.current = {};

    setTelemetry(INITIAL_TELEMETRY_STATE);
  }, []);

  // Set up listeners and snapshot loop
  useEffect(() => {
    if (!enabled) return;

    // Attach passive window listeners for high performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('focusin', handleFocusIn, { passive: true });
    window.addEventListener('focusout', handleFocusOut, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });

    // Periodic state snapshot timer (500ms)
    const snapshotInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityTimeRef.current;
      const sessionDurationMs = now - sessionStartTimeRef.current;

      // Check inactivity
      if (idleTime >= TELEMETRY_CONFIG.INACTIVITY_THRESHOLD_MS) {
        if (!isInactiveRef.current) {
          isInactiveRef.current = true;
          inactivityPeriodsCountRef.current += 1;
          if (onFrictionEvent) {
            onFrictionEvent({
              type: 'inactivity_started',
              idleDurationMs: idleTime,
              timestamp: now
            });
          }
        }
        currentInactivityMsRef.current = idleTime;
        accumulatedInactivityMsRef.current += TELEMETRY_CONFIG.SNAPSHOT_INTERVAL_MS;
      } else {
        currentInactivityMsRef.current = 0;
      }

      // Reset instantaneous velocity to 0 when mouse is at rest (> 120ms without move)
      if (now - lastMousePosRef.current.time > 120) {
        currentVelocityRef.current = 0;
        accelerationRef.current = 0;
      }

      // Live hesitation trigger while dwelling in an input field without typing
      if (activeFocusFieldRef.current && focusStartTimeRef.current) {
        const dwellDuration = now - focusStartTimeRef.current;
        if (dwellDuration >= TELEMETRY_CONFIG.FIELD_HESITATION_THRESHOLD_MS && !hasTriggeredDwellHesitationRef.current) {
          hasTriggeredDwellHesitationRef.current = true;
          hesitationEventsCountRef.current += 1;
          const currentStats = fieldHesitationsRef.current[activeFocusFieldRef.current] || {
            totalDurationMs: 0,
            count: 0,
            abandonedCount: 0,
            lastDurationMs: 0
          };
          fieldHesitationsRef.current = {
            ...fieldHesitationsRef.current,
            [activeFocusFieldRef.current]: {
              totalDurationMs: currentStats.totalDurationMs + dwellDuration,
              count: currentStats.count + 1,
              abandonedCount: currentStats.abandonedCount,
              lastDurationMs: dwellDuration
            }
          };
          if (onFrictionEvent) {
            onFrictionEvent({
              type: 'hesitation',
              target: activeFocusFieldRef.current,
              durationMs: dwellDuration,
              timestamp: now
            });
          }
        }
      }

      // Calculate kinematic moving averages & path efficiency
      const avgVelocity = calculateMovingAverage(velocityBufferRef.current);
      const efficiency = calculatePathEfficiency(
        startTrajectoryPosRef.current,
        lastMousePosRef.current,
        totalDistanceRef.current
      );
      const erraticScore = calculateErraticScore(trajectoryPointsRef.current);

      // Hesitation index & Inactivity pattern analysis
      const hesitationIndex = calculateHesitationIndex(fieldHesitationsRef.current);
      const idleAnalysis = analyzeInactivityPattern(
        accumulatedInactivityMsRef.current,
        sessionDurationMs,
        inactivityPeriodsCountRef.current
      );

      // Calculate normalized rage frustration score (0–100)
      const rageScore = calculateRageScore(rageClicksCountRef.current, deadClicksCountRef.current);

      // Current focus duration (if currently dwelling inside a field)
      const currentFocusDuration = focusStartTimeRef.current ? now - focusStartTimeRef.current : 0;

      // Update state snapshot for React components
      setTelemetry({
        cursorVelocity: currentVelocityRef.current,
        averageVelocity: avgVelocity,
        peakVelocity: peakVelocityRef.current,
        cursorAcceleration: accelerationRef.current,
        totalDistanceMoved: totalDistanceRef.current,
        pathEfficiency: efficiency,
        erraticMovementScore: erraticScore,
        movementEventCount: movementEventsRef.current,
        totalClickCount: totalClicksRef.current,
        rageClickCount: rageClicksCountRef.current,
        deadClickCount: deadClicksCountRef.current,
        rageScore,
        peakClickFrequency: peakClickFrequencyRef.current,
        lastClickedElement: lastClickedElementRef.current,
        rageClickHistory: [...rageClickHistoryRef.current],
        targetClickMap: { ...targetClickMapRef.current },
        isCurrentlyInactive: isInactiveRef.current,
        currentInactivityDurationMs: currentInactivityMsRef.current,
        totalInactivityDurationMs: accumulatedInactivityMsRef.current,
        inactivityPeriodsCount: inactivityPeriodsCountRef.current,
        longestInactivityPeriodMs: longestInactivityPeriodMsRef.current,
        idleAnalysis,
        hesitationEventsCount: hesitationEventsCountRef.current,
        hesitationIndex,
        fieldHesitations: { ...fieldHesitationsRef.current },
        activeFocusField: activeFocusFieldRef.current,
        currentFocusDurationMs: currentFocusDuration,
        validationErrorCount: validationErrorsCountRef.current,
        validationErrorFields: { ...validationErrorFieldsRef.current },
        sessionDurationMs,
        lastActivityTimestamp: lastActivityTimeRef.current
      });
    }, TELEMETRY_CONFIG.SNAPSHOT_INTERVAL_MS);

    // Clean up all listeners on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(snapshotInterval);
    };
  }, [enabled, handleMouseMove, handleClick, handleScroll, handleFocusIn, handleFocusOut, handleKeyDown, onFrictionEvent]);

  return {
    telemetry,
    recordValidationError,
    resetTelemetry,
    isTracking
  };
}
