import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TELEMETRY_CONFIG,
  calculateDistance,
  calculateVelocity,
  getSafeElementId
} from '../utils/telemetry';

const INITIAL_TELEMETRY_STATE = {
  // Movement & Velocity
  cursorVelocity: 0,           // px/ms
  totalDistanceMoved: 0,       // px
  movementEventCount: 0,

  // Clicks & Rage Clicks
  totalClickCount: 0,
  rageClickCount: 0,
  lastClickedElement: null,

  // Hesitation & Inactivity
  isCurrentlyInactive: false,
  totalInactivityDurationMs: 0,
  hesitationEventsCount: 0,
  fieldHesitations: {},        // { [field]: durationMs before first typing }

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
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether tracking is active
 * @param {Function} [options.onFrictionEvent] - Callback triggered when significant friction is detected
 */
export default function useTelemetry(options = {}) {
  const { enabled = true, onFrictionEvent } = options;

  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY_STATE);
  const [isTracking, setIsTracking] = useState(enabled);

  // Performance Refs (prevent high-frequency re-renders on mousemove)
  const sessionStartTimeRef = useRef(Date.now());
  const lastActivityTimeRef = useRef(Date.now());
  const isInactiveRef = useRef(false);
  const accumulatedInactivityMsRef = useRef(0);

  // Movement Tracking Refs
  const lastMousePosRef = useRef({ x: 0, y: 0, time: Date.now() });
  const totalDistanceRef = useRef(0);
  const currentVelocityRef = useRef(0);
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

  // 1. Mouse Movement Listener (Throttled)
  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    lastActivityTimeRef.current = now;
    if (isInactiveRef.current) {
      isInactiveRef.current = false;
    }

    const last = lastMousePosRef.current;
    const timeDelta = now - last.time;

    if (timeDelta >= TELEMETRY_CONFIG.SAMPLE_INTERVAL_MS) {
      const distance = calculateDistance(last.x, last.y, e.clientX, e.clientY);
      const velocity = calculateVelocity(distance, timeDelta);

      totalDistanceRef.current += Math.round(distance);
      currentVelocityRef.current = velocity;
      movementEventsRef.current += 1;

      lastMousePosRef.current = { x: e.clientX, y: e.clientY, time: now };
    }
  }, []);

  // 2. Click & Rage Click Listener
  const handleClick = useCallback((e) => {
    const now = Date.now();
    lastActivityTimeRef.current = now;
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
  }, [onFrictionEvent]);

  // 3. Focus and Hesitation Tracking Listeners
  const handleFocusIn = useCallback((e) => {
    const fieldId = getSafeElementId(e.target);
    activeFocusFieldRef.current = fieldId;
    focusStartTimeRef.current = Date.now();
    lastActivityTimeRef.current = Date.now();
  }, []);

  const handleKeyDown = useCallback((e) => {
    const now = Date.now();
    lastActivityTimeRef.current = now;

    // Check hesitation before first keystroke in the currently focused field
    if (activeFocusFieldRef.current && focusStartTimeRef.current) {
      const field = activeFocusFieldRef.current;
      const hesitation = now - focusStartTimeRef.current;

      // Record hesitation if not already recorded for this field visit
      if (hesitation >= TELEMETRY_CONFIG.FIELD_HESITATION_THRESHOLD_MS) {
        hesitationEventsCountRef.current += 1;
        fieldHesitationsRef.current = {
          ...fieldHesitationsRef.current,
          [field]: (fieldHesitationsRef.current[field] || 0) + hesitation
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

      // Reset so subsequent typing in the same field focus does not count as hesitation
      focusStartTimeRef.current = null;
    }
  }, [onFrictionEvent]);

  // 4. Record Form Validation Error (Callable externally)
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

  // 5. Reset All Telemetry
  const resetTelemetry = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
    lastActivityTimeRef.current = Date.now();
    isInactiveRef.current = false;
    accumulatedInactivityMsRef.current = 0;

    totalDistanceRef.current = 0;
    currentVelocityRef.current = 0;
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
    window.addEventListener('focusin', handleFocusIn, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });

    // Periodic state snapshot timer (500ms)
    const snapshotInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityTimeRef.current;

      // Check inactivity
      if (idleTime >= TELEMETRY_CONFIG.INACTIVITY_THRESHOLD_MS) {
        if (!isInactiveRef.current) {
          isInactiveRef.current = true;
        }
        accumulatedInactivityMsRef.current += TELEMETRY_CONFIG.SNAPSHOT_INTERVAL_MS;
      }

      // Update state snapshot for React components (Dashboard / Score)
      setTelemetry({
        cursorVelocity: currentVelocityRef.current,
        totalDistanceMoved: totalDistanceRef.current,
        movementEventCount: movementEventsRef.current,
        totalClickCount: totalClicksRef.current,
        rageClickCount: rageClicksCountRef.current,
        lastClickedElement: lastClickedElementRef.current,
        isCurrentlyInactive: isInactiveRef.current,
        totalInactivityDurationMs: accumulatedInactivityMsRef.current,
        hesitationEventsCount: hesitationEventsCountRef.current,
        fieldHesitations: { ...fieldHesitationsRef.current },
        validationErrorCount: validationErrorsCountRef.current,
        validationErrorFields: { ...validationErrorFieldsRef.current },
        sessionDurationMs: now - sessionStartTimeRef.current,
        lastActivityTimestamp: lastActivityTimeRef.current
      });
    }, TELEMETRY_CONFIG.SNAPSHOT_INTERVAL_MS);

    // Clean up all listeners on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(snapshotInterval);
    };
  }, [enabled, handleMouseMove, handleClick, handleFocusIn, handleKeyDown]);

  return {
    telemetry,
    recordValidationError,
    resetTelemetry,
    isTracking
  };
}
