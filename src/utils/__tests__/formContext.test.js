import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFormProgress, extractFormContext } from '../formContext.js';

describe('AuraGen - Form Context & Progress Calculator', () => {
  describe('calculateFormProgress', () => {
    it('should return 0% for empty form', () => {
      const progress = calculateFormProgress({});
      assert.equal(progress.completedCount, 0);
      assert.equal(progress.totalCount, 7);
      assert.equal(progress.percentage, 0);
    });

    it('should correctly calculate partial completion percentage', () => {
      const partial = {
        fullName: 'Aniket Sarovar',
        email: 'aniket@example.com',
        phone: '9876543210'
      };
      // 3 of 7 fields = Math.round((3/7)*100) = 43%
      const progress = calculateFormProgress(partial);
      assert.equal(progress.completedCount, 3);
      assert.equal(progress.percentage, 43);
    });

    it('should return 100% when all 7 core fields are filled', () => {
      const full = {
        fullName: 'Aniket Sarovar',
        email: 'aniket@example.com',
        phone: '9876543210',
        employmentStatus: 'salaried',
        annualIncome: '800000',
        loanAmount: '400000',
        loanPurpose: 'education'
      };
      const progress = calculateFormProgress(full);
      assert.equal(progress.completedCount, 7);
      assert.equal(progress.percentage, 100);
    });
  });

  describe('extractFormContext', () => {
    it('should generate context conforming to Member 3 AI prompt requirements', () => {
      const formData = {
        fullName: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543210',
        employmentStatus: 'salaried',
        annualIncome: '600000',
        loanAmount: '200000',
        loanPurpose: 'home'
      };

      const errors = {
        annualIncome: 'Income must be a valid numeric amount'
      };

      const context = extractFormContext(formData, errors, {
        cognitiveScore: 75,
        problematicField: 'annualIncome'
      });

      // Verify AI contract fields
      assert.ok(context.formContext);
      assert.equal(context.formContext.cognitiveLoadScore, 75);
      assert.equal(context.formContext.problematicField, 'annualIncome');
      assert.ok(context.formContext.frictionDetails.includes('annualIncome'));
      assert.equal(context.formContext.formData.fullName, 'Priya Sharma');
      assert.equal(context.progress.percentage, 100);
      assert.equal(context.metadata.hasActiveErrors, true);
    });
  });
});
