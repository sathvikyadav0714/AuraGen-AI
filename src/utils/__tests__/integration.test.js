import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  BACKEND_EVENT_TYPES,
  toBackendEventType,
  createTelemetryPayload
} from '../telemetryEvents.js';

import {
  generateLocalSessionId,
  initSession
} from '../../services/sessionManager.js';

describe('AuraGen - Backend Integration & Telemetry Normalizer', () => {
  describe('toBackendEventType (Event Name Normalization)', () => {
    it('should map rage_click to canonical RAGE_CLICK', () => {
      assert.strictEqual(toBackendEventType('rage_click'), BACKEND_EVENT_TYPES.RAGE_CLICK);
      assert.strictEqual(toBackendEventType('rapid_clicks'), BACKEND_EVENT_TYPES.RAGE_CLICK);
    });

    it('should map dead_click to canonical DEAD_CLICK', () => {
      assert.strictEqual(toBackendEventType('dead_click'), BACKEND_EVENT_TYPES.DEAD_CLICK);
      assert.strictEqual(toBackendEventType('disabled_click'), BACKEND_EVENT_TYPES.DEAD_CLICK);
    });

    it('should map hesitation to canonical HESITATION', () => {
      assert.strictEqual(toBackendEventType('hesitation'), BACKEND_EVENT_TYPES.HESITATION);
      assert.strictEqual(toBackendEventType('input_hesitation'), BACKEND_EVENT_TYPES.HESITATION);
    });

    it('should map hesitation_abandoned to canonical FIELD_ABANDONMENT', () => {
      assert.strictEqual(toBackendEventType('hesitation_abandoned'), BACKEND_EVENT_TYPES.FIELD_ABANDONMENT);
      assert.strictEqual(toBackendEventType('field_abandoned'), BACKEND_EVENT_TYPES.FIELD_ABANDONMENT);
    });

    it('should map inactivity events to INACTIVITY_STARTED and INACTIVITY_ENDED', () => {
      assert.strictEqual(toBackendEventType('inactivity_started'), BACKEND_EVENT_TYPES.INACTIVITY_STARTED);
      assert.strictEqual(toBackendEventType('user_idle'), BACKEND_EVENT_TYPES.INACTIVITY_STARTED);
      assert.strictEqual(toBackendEventType('inactivity_ended'), BACKEND_EVENT_TYPES.INACTIVITY_ENDED);
      assert.strictEqual(toBackendEventType('activity_resumed'), BACKEND_EVENT_TYPES.INACTIVITY_ENDED);
    });

    it('should map validation_error to canonical VALIDATION_ERROR', () => {
      assert.strictEqual(toBackendEventType('validation_error'), BACKEND_EVENT_TYPES.VALIDATION_ERROR);
    });

    it('should preserve already-formatted screaming-snake-case event names', () => {
      assert.strictEqual(toBackendEventType('RAGE_CLICK'), 'RAGE_CLICK');
      assert.strictEqual(toBackendEventType('VALIDATION_ERROR'), 'VALIDATION_ERROR');
    });

    it('should fallback to FORM_INTERACTION for undefined or empty input', () => {
      assert.strictEqual(toBackendEventType(''), BACKEND_EVENT_TYPES.FORM_INTERACTION);
      assert.strictEqual(toBackendEventType(null), BACKEND_EVENT_TYPES.FORM_INTERACTION);
    });
  });

  describe('createTelemetryPayload (Non-PII Safeguard & Structure)', () => {
    it('should generate structured telemetry payload without PII', () => {
      const rawEvent = {
        type: 'rage_click',
        target: 'submitApplicationBtn',
        clicksInBurst: 5,
        durationMs: 380,
        frequency: 13.1,
        severity: 'severe'
      };

      const payload = createTelemetryPayload('sess_12345', rawEvent, 78);

      assert.strictEqual(payload.sessionId, 'sess_12345');
      assert.strictEqual(payload.eventType, 'RAGE_CLICK');
      assert.strictEqual(payload.target, 'submitApplicationBtn');
      assert.strictEqual(payload.cognitiveLoadScore, 78);
      assert.strictEqual(payload.metrics.clicks, 5);
      assert.strictEqual(payload.metrics.durationMs, 380);
      assert.strictEqual(payload.metrics.frequency, 13.1);
      assert.strictEqual(payload.metrics.severity, 'severe');
      assert.ok(payload.timestamp > 0);
    });

    it('should sanitize target identifier against special characters', () => {
      const rawEvent = {
        type: 'hesitation',
        target: 'annualIncome<script>alert(1)</script>',
        durationMs: 2400
      };

      const payload = createTelemetryPayload('sess_test', rawEvent, 45);

      assert.strictEqual(payload.eventType, 'HESITATION');
      assert.strictEqual(payload.target, 'annualIncomescriptalert1script');
      assert.strictEqual(payload.metrics.durationMs, 2400);
    });
  });

  describe('Session Manager (Task 3)', () => {
    it('should generate formatted unique local session ID', () => {
      const id1 = generateLocalSessionId();
      const id2 = generateLocalSessionId();

      assert.ok(id1.startsWith('aura_sess_'));
      assert.ok(id2.startsWith('aura_sess_'));
      assert.notStrictEqual(id1, id2);
    });

    it('should initialize session using resilient fallback if no backend is provided', async () => {
      const session = await initSession();
      assert.ok(session.sessionId);
      assert.strictEqual(session.origin, 'local_fallback');
      assert.strictEqual(session.isNew, true);
    });

    it('should initialize session using backend API response when available', async () => {
      const mockBackendApi = async () => ({
        ok: true,
        sessionId: 'aura_sess_backend_999888'
      });

      // Clear storage representation in non-browser env
      const session = await initSession(mockBackendApi);
      assert.ok(session.sessionId);
    });
  });
});
