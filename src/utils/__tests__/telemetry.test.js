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
});
