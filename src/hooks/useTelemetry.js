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

  // Clicks & Rage Clicks
  totalClickCount: 0,
  rageClickCount: 0,
  lastClickedElement: null,

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
 * - Real-time inactivity & pause detection
 * - Field-level focus hesitation and abandonment measurement
 * - Cursor kinematics (velocity, acceleration, erratic path trajectory)
 * - Rage-click burst monitoring
 * - Non-PII privacy guarantee (only element metadata, never values)
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

  // Click & Rage Click Tracking Refs
  const totalClicksRef = useRef(0);
  const recentClicksRef = useRef([]); // Stores [{ x, y, time, target }]
  const rageClicksCountRef = useRef(0);
  const lastClickedElementRef = useRef(null);

  // Hesitation Tracking Refs
  const activeFocusFieldRef = useRef(null);
  const focusStartTimeRef = useRef(null);
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

  // 2. Click & Rage Click Listener
  const handleClick = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);
    totalClicksRef.current += 1;

    const safeTarget = getSafeElementId(e.target);
    lastClickedElementRef.current = safeTarget;

    const currentClick = {
      x: e.clientX,
      y: e.clientY,
      time: now,
      target: safeTarget
    };

    // Filter clicks within the rage click window (e.g. 600ms)
    const windowStart = now - TELEMETRY_CONFIG.RAGE_CLICK_WINDOW_MS;
    const recent = recentClicksRef.current.filter((c) => c.time >= windowStart);
    recent.push(currentClick);
    recentClicksRef.current = recent;

    // Detect rage clicks (3+ clicks within 600ms on same location / target)
    if (recent.length >= TELEMETRY_CONFIG.RAGE_CLICK_MIN_COUNT) {
      const first = recent[0];
      const dist = calculateDistance(first.x, first.y, currentClick.x, currentClick.y);

      if (dist <= TELEMETRY_CONFIG.RAGE_CLICK_MAX_DISTANCE_PX) {
        rageClicksCountRef.current += 1;
        recentClicksRef.current = []; // Reset after registering rage click

        if (onFrictionEvent) {
          onFrictionEvent({
            type: 'rage_click',
            target: safeTarget,
            clicksInBurst: recent.length,
            timestamp: now
          });
        }
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
  }, [registerUserActivity]);

  const handleFocusOut = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);

    // If user focused on a field and left without typing, check abandonment delay
    if (activeFocusFieldRef.current && focusStartTimeRef.current) {
      const field = activeFocusFieldRef.current;
      const abandonmentDelay = now - focusStartTimeRef.current;

      if (isFieldHesitant(abandonmentDelay, TELEMETRY_CONFIG.FIELD_HESITATION_THRESHOLD_MS)) {
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
  }, [onFrictionEvent, registerUserActivity]);

  const handleKeyDown = useCallback((e) => {
    const now = Date.now();
    registerUserActivity(now);

    // Check hesitation before first keystroke in the currently focused field
    if (activeFocusFieldRef.current && focusStartTimeRef.current) {
      const field = activeFocusFieldRef.current;
      const hesitation = now - focusStartTimeRef.current;

      // Record hesitation if threshold exceeded
      if (isFieldHesitant(hesitation, TELEMETRY_CONFIG.FIELD_HESITATION_THRESHOLD_MS)) {
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
    lastClickedElementRef.current = null;

    activeFocusFieldRef.current = null;
    focusStartTimeRef.current = null;
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
        lastClickedElement: lastClickedElementRef.current,
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
