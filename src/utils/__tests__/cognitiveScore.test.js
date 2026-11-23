import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COGNITIVE_CONFIG,
  calculateCognitiveScore,
  getCognitiveScoreBreakdown,
  classifyCognitiveLoad
} from '../cognitiveScore.js';

describe('AuraGen - Cognitive Load Scoring Algorithm (Day 11)', () => {
  describe('calculateCognitiveScore', () => {
    it('should return baseline score for empty or fresh telemetry', () => {
      assert.equal(calculateCognitiveScore({}), COGNITIVE_CONFIG.BASELINE_SCORE);
      assert.equal(calculateCognitiveScore(null), COGNITIVE_CONFIG.BASELINE_SCORE);
      assert.equal(calculateCognitiveScore(undefined), COGNITIVE_CONFIG.BASELINE_SCORE);
    });

    it('should accurately factor hesitation events', () => {
      // 10 baseline + (2 * 12) = 34
      const telemetry = { hesitationEventsCount: 2 };
      assert.equal(calculateCognitiveScore(telemetry), 34);
    });

    it('should heavily weight rage click bursts', () => {
      // 10 baseline + (1 * 25) = 35
      const telemetry = { rageClickCount: 1 };
      assert.equal(calculateCognitiveScore(telemetry), 35);

      // 10 baseline + (2 * 25) = 60
      assert.equal(calculateCognitiveScore({ rageClickCount: 2 }), 60);
    });

    it('should weight dead clicks on disabled elements', () => {
      // 10 baseline + (3 * 8) = 34
      const telemetry = { deadClickCount: 3 };
      assert.equal(calculateCognitiveScore(telemetry), 34);
    });

    it('should weight validation errors', () => {
      // 10 baseline + (2 * 15) = 40
      const telemetry = { validationErrorCount: 2 };
      assert.equal(calculateCognitiveScore(telemetry), 40);
    });

    it('should apply wandering trajectory efficiency penalty when efficiency < 40% and distance > 100px', () => {
      // 10 baseline + 10 low-efficiency penalty = 20
      const telemetry = { pathEfficiency: 30, totalDistanceMoved: 350 };
      assert.equal(calculateCognitiveScore(telemetry), 20);

      // Should not penalize if total distance moved is trivial (< 100px)
      const minorMove = { pathEfficiency: 20, totalDistanceMoved: 40 };
      assert.equal(calculateCognitiveScore(minorMove), 10);
    });

    it('should factor active inactivity stall state', () => {
      // 10 baseline + 12 inactivity penalty = 22
      const telemetry = { isCurrentlyInactive: true };
      assert.equal(calculateCognitiveScore(telemetry), 22);
    });

    it('should calculate compound multi-factor high friction score', () => {
      // 10 baseline + (2 * 12 hesitation = 24) + (1 * 25 rage = 25) + (1 * 15 error = 15) = 74
      const compound = {
        hesitationEventsCount: 2,
        rageClickCount: 1,
        validationErrorCount: 1
      };
      assert.equal(calculateCognitiveScore(compound), 74);
    });

    it('should clamp output strictly between 5 and 100', () => {
      // Maximum cap
      const extreme = {
        rageClickCount: 10,
        hesitationEventsCount: 10,
        validationErrorCount: 10
      };
      assert.equal(calculateCognitiveScore(extreme), 100);
    });
  });

  describe('getCognitiveScoreBreakdown', () => {
    it('should provide complete factor contribution diagnostics', () => {
      const telemetry = {
        hesitationEventsCount: 1, // 12 pts
        rageClickCount: 2,        // 50 pts
        validationErrorCount: 1,  // 15 pts
        deadClickCount: 1,        // 8 pts
        isCurrentlyInactive: false
      };
      const breakdown = getCognitiveScoreBreakdown(telemetry);

      assert.equal(breakdown.baseline, 10);
      assert.equal(breakdown.hesitationPoints, 12);
      assert.equal(breakdown.rageClickPoints, 50);
      assert.equal(breakdown.deadClickPoints, 8);
      assert.equal(breakdown.validationErrorPoints, 15);
      assert.equal(breakdown.totalScore, 95);
      assert.equal(breakdown.primaryDriver, 'Rage Clicks');
    });

    it('should identify Hesitation Pauses as dominant factor when applicable', () => {
      const telemetry = {
        hesitationEventsCount: 4, // 48 pts
        deadClickCount: 1         // 8 pts
      };
      const breakdown = getCognitiveScoreBreakdown(telemetry);
      assert.equal(breakdown.primaryDriver, 'Hesitation Pauses');
    });
  });

  describe('classifyCognitiveLoad', () => {
    it('should classify score < 35 as OPTIMAL focus tier', () => {
      const classification = classifyCognitiveLoad(20);
      assert.equal(classification.tier, 'OPTIMAL');
      assert.equal(classification.shouldTriggerGenerativeUi, false);
      assert.equal(classification.color, 'text-emerald-400');
    });

    it('should classify score between 35 and 64 as MODERATE tier', () => {
      const classification = classifyCognitiveLoad(50);
      assert.equal(classification.tier, 'MODERATE');
      assert.equal(classification.shouldTriggerGenerativeUi, false);
      assert.equal(classification.color, 'text-amber-400');
    });

    it('should classify score >= 65 as HIGH friction triggering generative UI', () => {
      const classification = classifyCognitiveLoad(65);
      assert.equal(classification.tier, 'HIGH');
      assert.equal(classification.shouldTriggerGenerativeUi, true);
      assert.equal(classification.color, 'text-rose-400');

      const extreme = classifyCognitiveLoad(95);
      assert.equal(extreme.tier, 'HIGH');
      assert.equal(extreme.shouldTriggerGenerativeUi, true);
    });
  });
});
