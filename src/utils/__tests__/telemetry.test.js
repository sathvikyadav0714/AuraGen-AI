import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistance,
  calculateVelocity,
  calculateAcceleration,
  calculateMovingAverage,
  calculatePathEfficiency,
  calculateErraticScore,
  formatDuration,
  isFieldHesitant,
  calculateHesitationIndex,
  formatHesitationSummary,
  analyzeInactivityPattern,
  isElementDisabled,
  calculateClickFrequency,
  analyzeClickBurst,
  calculateRageScore,
  getSafeElementId,
  TELEMETRY_CONFIG
} from '../telemetry.js';

describe('AuraGen - Telemetry Utilities', () => {
  describe('calculateDistance', () => {
    it('should return 0 when points are identical', () => {
      assert.equal(calculateDistance(100, 100, 100, 100), 0);
    });

    it('should calculate correct Euclidean distance for horizontal and vertical moves', () => {
      assert.equal(calculateDistance(0, 0, 3, 4), 5); // 3-4-5 right triangle
      assert.equal(calculateDistance(10, 20, 10, 50), 30);
    });
  });

  describe('calculateVelocity', () => {
    it('should return 0 for zero or negative timeDelta', () => {
      assert.equal(calculateVelocity(100, 0), 0);
      assert.equal(calculateVelocity(100, -10), 0);
    });

    it('should calculate velocity accurately in px/ms', () => {
      // 100px moved in 50ms = 2.000 px/ms
      assert.equal(calculateVelocity(100, 50), 2);
      // 25px moved in 100ms = 0.250 px/ms
      assert.equal(calculateVelocity(25, 100), 0.25);
    });
  });

  describe('calculateAcceleration', () => {
    it('should calculate positive acceleration for speed increase', () => {
      // Current 2.0, Previous 1.0, over 50ms = 1.0 / 50 = 0.02 px/ms^2
      assert.equal(calculateAcceleration(2.0, 1.0, 50), 0.02);
    });

    it('should calculate negative deceleration for speed decrease', () => {
      assert.equal(calculateAcceleration(1.0, 2.0, 50), -0.02);
    });
  });

  describe('calculateMovingAverage', () => {
    it('should return 0 for empty array', () => {
      assert.equal(calculateMovingAverage([]), 0);
    });

    it('should compute accurate moving average', () => {
      assert.equal(calculateMovingAverage([1.0, 2.0, 3.0]), 2.0);
      assert.equal(calculateMovingAverage([0.5, 0.5, 0.5]), 0.5);
    });
  });

  describe('calculatePathEfficiency', () => {
    it('should return 100% for straight-line motion', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 0 };
      // Traveled 100px total in a straight line
      assert.equal(calculatePathEfficiency(start, end, 100), 100);
    });

    it('should return lower efficiency for wandering motion', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 10, y: 0 };
      // Traveled 100px total to only move 10px forward (wandering)
      assert.equal(calculatePathEfficiency(start, end, 100), 10);
    });
  });

  describe('calculateErraticScore', () => {
    it('should return 0 for straight continuous line (no sharp turns)', () => {
      const straightPoints = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
        { x: 30, y: 0 }
      ];
      assert.equal(calculateErraticScore(straightPoints), 0);
    });

    it('should return high score for zig-zag erratic reversals', () => {
      const zigZagPoints = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 0, y: 0 }
      ];
      const score = calculateErraticScore(zigZagPoints);
      assert.ok(score >= 60, `Expected score >= 60, got ${score}`);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds into readable seconds', () => {
      assert.equal(formatDuration(0), '0.0s');
      assert.equal(formatDuration(1500), '1.5s');
      assert.equal(formatDuration(3200), '3.2s');
      assert.equal(formatDuration(60000), '60.0s');
    });
  });

  describe('getSafeElementId (Privacy Safeguard)', () => {
    it('should prioritize data-telemetry-field attribute', () => {
      const mockElement = {
        getAttribute: (attr) => (attr === 'data-telemetry-field' ? 'annualIncome' : null),
        name: 'income_field',
        id: 'input-1'
      };
      assert.equal(getSafeElementId(mockElement), 'annualIncome');
    });

    it('should fallback to name, id, or tag name safely', () => {
      const mockElementWithName = {
        getAttribute: () => null,
        name: 'loanAmount'
      };
      assert.equal(getSafeElementId(mockElementWithName), 'loanAmount');

      const mockElementWithTag = {
        getAttribute: () => null,
        tagName: 'BUTTON'
      };
      assert.equal(getSafeElementId(mockElementWithTag), 'button');
    });
  });

  describe('Telemetry Configuration Safeguards', () => {
    it('should define robust thresholds', () => {
      assert.ok(TELEMETRY_CONFIG.INACTIVITY_THRESHOLD_MS >= 2000);
      assert.ok(TELEMETRY_CONFIG.RAGE_CLICK_MIN_COUNT >= 3);
      assert.ok(TELEMETRY_CONFIG.RAGE_CLICK_WINDOW_MS <= 1000);
    });
  });

  describe('isFieldHesitant (Day 8)', () => {
    it('should return false for invalid or negative inputs', () => {
      assert.equal(isFieldHesitant(null), false);
      assert.equal(isFieldHesitant(-500), false);
      assert.equal(isFieldHesitant(undefined), false);
    });

    it('should return false for durations below default threshold (2000ms)', () => {
      assert.equal(isFieldHesitant(500), false);
      assert.equal(isFieldHesitant(1999), false);
    });

    it('should return true for durations at or exceeding threshold', () => {
      assert.equal(isFieldHesitant(2000), true);
      assert.equal(isFieldHesitant(3500), true);
    });

    it('should respect custom threshold', () => {
      assert.equal(isFieldHesitant(1500, 1000), true);
      assert.equal(isFieldHesitant(900, 1000), false);
    });
  });

  describe('calculateHesitationIndex (Day 8)', () => {
    it('should return 0 for empty hesitations object', () => {
      assert.equal(calculateHesitationIndex({}), 0);
    });

    it('should calculate accurate score for numeric duration mapping', () => {
      // 2500ms + 2500ms = 5000ms -> (5000 / 10000) * 100 = 50
      assert.equal(calculateHesitationIndex({ fullName: 2500, loanAmount: 2500 }), 50);
    });

    it('should calculate accurate score for rich object mapping', () => {
      const stats = {
        fullName: { totalDurationMs: 3000, count: 1, abandonedCount: 0 },
        email: { totalDurationMs: 4000, count: 2, abandonedCount: 1 }
      };
      // 7000ms -> (7000 / 10000) * 100 = 70
      assert.equal(calculateHesitationIndex(stats), 70);
    });

    it('should cap penalty index at 100', () => {
      assert.equal(calculateHesitationIndex({ loanAmount: 25000 }), 100);
    });
  });

  describe('formatHesitationSummary (Day 8)', () => {
    it('should return "None" when no hesitations exist', () => {
      assert.equal(formatHesitationSummary({}), 'None');
      assert.equal(formatHesitationSummary({ fullName: 0 }), 'None');
    });

    it('should format and sort fields by descending hesitation duration', () => {
      const hesitations = {
        fullName: 1500,
        loanAmount: 4200,
        annualIncome: 2800
      };
      const summary = formatHesitationSummary(hesitations);
      assert.equal(summary, 'loanAmount (4.2s), annualIncome (2.8s), fullName (1.5s)');
    });

    it('should support rich stats objects', () => {
      const hesitations = {
        mobile: { totalDurationMs: 3100 },
        loanAmount: { totalDurationMs: 5000 }
      };
      const summary = formatHesitationSummary(hesitations);
      assert.equal(summary, 'loanAmount (5.0s), mobile (3.1s)');
    });
  });

  describe('analyzeInactivityPattern (Day 8)', () => {
    it('should handle zero or negative session duration safely', () => {
      const result = analyzeInactivityPattern(0, 0);
      assert.equal(result.idleRatio, 0);
      assert.equal(result.severity, 'normal');
      assert.equal(result.isExcessive, false);
      assert.equal(result.averageIdlePeriodMs, 0);
    });

    it('should classify low idle ratio as normal', () => {
      // 2000ms idle in 20,000ms session = 10%
      const result = analyzeInactivityPattern(2000, 20000, 1);
      assert.equal(result.idleRatio, 10);
      assert.equal(result.severity, 'normal');
      assert.equal(result.isExcessive, false);
      assert.equal(result.averageIdlePeriodMs, 2000);
    });

    it('should classify 25%-49% idle ratio as moderate', () => {
      // 6000ms idle in 20,000ms session = 30%
      const result = analyzeInactivityPattern(6000, 20000, 2);
      assert.equal(result.idleRatio, 30);
      assert.equal(result.severity, 'moderate');
      assert.equal(result.isExcessive, false);
      assert.equal(result.averageIdlePeriodMs, 3000);
    });

    it('should classify 50%+ idle ratio as high and excessive', () => {
      // 12,000ms idle in 20,000ms session = 60%
      const result = analyzeInactivityPattern(12000, 20000, 3);
      assert.equal(result.idleRatio, 60);
      assert.equal(result.severity, 'high');
      assert.equal(result.isExcessive, true);
      assert.equal(result.averageIdlePeriodMs, 4000);
    });
  });

  describe('isElementDisabled (Day 9)', () => {
    it('should return false for null or normal interactive elements', () => {
      assert.equal(isElementDisabled(null), false);
      const normalBtn = { disabled: false, getAttribute: () => null };
      assert.equal(isElementDisabled(normalBtn), false);
    });

    it('should return true for disabled=true or aria-disabled=true', () => {
      const disabledBtn = { disabled: true, getAttribute: () => null };
      assert.equal(isElementDisabled(disabledBtn), true);

      const ariaDisabledBtn = {
        disabled: false,
        getAttribute: (attr) => (attr === 'aria-disabled' ? 'true' : null)
      };
      assert.equal(isElementDisabled(ariaDisabledBtn), true);
    });
  });

  describe('calculateClickFrequency (Day 9)', () => {
    it('should return 0 for single click or zero duration', () => {
      assert.equal(calculateClickFrequency(1, 1000), 0);
      assert.equal(calculateClickFrequency(3, 0), 0);
    });

    it('should calculate accurate clicks per second', () => {
      // 4 clicks in 500ms = 8.0 clicks/sec
      assert.equal(calculateClickFrequency(4, 500), 8);
      // 3 clicks in 600ms = 5.0 clicks/sec
      assert.equal(calculateClickFrequency(3, 600), 5);
    });
  });

  describe('analyzeClickBurst (Day 9)', () => {
    it('should return isRageClick=false for fewer than 3 clicks', () => {
      const clicks = [
        { x: 100, y: 100, time: 1000, target: 'btn' },
        { x: 102, y: 101, time: 1200, target: 'btn' }
      ];
      const result = analyzeClickBurst(clicks);
      assert.equal(result.isRageClick, false);
      assert.equal(result.clicksInBurst, 2);
    });

    it('should return isRageClick=false if clicks are spatially dispersed (wandering clicks)', () => {
      const dispersedClicks = [
        { x: 100, y: 100, time: 1000, target: 'btn' },
        { x: 200, y: 200, time: 1200, target: 'btn' }, // 141px away
        { x: 300, y: 300, time: 1400, target: 'btn' }
      ];
      const result = analyzeClickBurst(dispersedClicks, 600, 20);
      assert.equal(result.isRageClick, false);
    });

    it('should detect rage click burst in tight radius within window', () => {
      const rapidClicks = [
        { x: 100, y: 100, time: 1000, target: 'btn' },
        { x: 105, y: 102, time: 1150, target: 'btn' },
        { x: 102, y: 104, time: 1300, target: 'btn' }
      ];
      // 3 clicks in 300ms, max radius ~5.4px
      const result = analyzeClickBurst(rapidClicks, 600, 20);
      assert.equal(result.isRageClick, true);
      assert.equal(result.clicksInBurst, 3);
      assert.equal(result.durationMs, 300);
      assert.equal(result.frequency, 10);
      assert.equal(result.severity, 'severe'); // frequency 10 >= 8
    });

    it('should classify mild and moderate severity bursts', () => {
      // 3 clicks over 500ms (frequency = 6.0/s -> moderate)
      const moderateClicks = [
        { x: 100, y: 100, time: 1000, target: 'btn' },
        { x: 102, y: 100, time: 1250, target: 'btn' },
        { x: 101, y: 101, time: 1500, target: 'btn' }
      ];
      const modResult = analyzeClickBurst(moderateClicks, 600, 20);
      assert.equal(modResult.isRageClick, true);
      assert.equal(modResult.severity, 'moderate');
    });
  });

  describe('calculateRageScore (Day 9)', () => {
    it('should return 0 for zero rage clicks and dead clicks', () => {
      assert.equal(calculateRageScore(0, 0), 0);
    });

    it('should weight rage clicks (25 pts) and dead clicks (10 pts)', () => {
      // 2 rage clicks (50) + 1 dead click (10) = 60
      assert.equal(calculateRageScore(2, 1), 60);
    });

    it('should cap rage score at 100', () => {
      assert.equal(calculateRageScore(5, 5), 100);
    });
  });
});
