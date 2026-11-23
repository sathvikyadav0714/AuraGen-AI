import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validateEmploymentStatus,
  validateAnnualIncome,
  validateLoanAmount,
  validateLoanPurpose,
  validateTermsAgreement,
  validateFinancialForm,
  validateSingleField
} from '../validation.js';

describe('AuraGen - Financial Form Validation Engine', () => {
  describe('Full Name Validation', () => {
    it('should reject empty or whitespace-only names', () => {
      assert.equal(validateFullName(''), 'Full legal name is required');
      assert.equal(validateFullName('   '), 'Full legal name is required');
    });

    it('should reject names shorter than 3 characters', () => {
      assert.equal(validateFullName('Al'), 'Name must contain at least 3 characters');
    });

    it('should reject names with numeric digits or invalid symbols', () => {
      assert.equal(validateFullName('Rahul123'), 'Name should only contain letters and spaces');
      assert.equal(validateFullName('Aniket@'), 'Name should only contain letters and spaces');
    });

    it('should accept legitimate names', () => {
      assert.equal(validateFullName('Rahul Sharma'), '');
      assert.equal(validateFullName('Aniket Sarovar'), '');
      assert.equal(validateFullName("O'Connor"), '');
    });
  });

  describe('Email Address Validation', () => {
    it('should reject empty email', () => {
      assert.equal(validateEmail(''), 'Email address is required');
    });

    it('should reject malformed email strings', () => {
      assert.equal(validateEmail('invalid-email'), 'Please enter a valid email address (e.g., rahul@example.com)');
      assert.equal(validateEmail('rahul@'), 'Please enter a valid email address (e.g., rahul@example.com)');
      assert.equal(validateEmail('rahul@domain'), 'Please enter a valid email address (e.g., rahul@example.com)');
    });

    it('should accept valid email addresses', () => {
      assert.equal(validateEmail('rahul.sharma@example.com'), '');
      assert.equal(validateEmail('aniket@auragen.dev'), '');
    });
  });

  describe('Mobile Phone Validation', () => {
    it('should reject empty phone number', () => {
      assert.equal(validatePhone(''), 'Mobile phone number is required');
    });

    it('should reject numbers not equal to 10 digits', () => {
      assert.equal(validatePhone('98765'), 'Mobile number must be exactly 10 digits');
      assert.equal(validatePhone('987654321012'), 'Mobile number must be exactly 10 digits');
    });

    it('should reject numbers not starting with 6, 7, 8, or 9', () => {
      assert.equal(validatePhone('1234567890'), 'Mobile number must start with 6, 7, 8, or 9');
      assert.equal(validatePhone('5555555555'), 'Mobile number must start with 6, 7, 8, or 9');
    });

    it('should reject repeating dummy sequences', () => {
      assert.equal(validatePhone('9999999999'), 'Please enter a legitimate phone number');
      assert.equal(validatePhone('8888888888'), 'Please enter a legitimate phone number');
    });

    it('should accept valid 10-digit Indian phone numbers', () => {
      assert.equal(validatePhone('9876543210'), '');
      assert.equal(validatePhone('8123456789'), '');
      assert.equal(validatePhone('+91 9876543210'), ''); // Cleans prefix
    });
  });

  describe('Annual Income Validation', () => {
    it('should reject missing or non-numeric values', () => {
      assert.equal(validateAnnualIncome(''), 'Annual gross income is required');
      assert.equal(validateAnnualIncome('abc'), 'Income must be a valid numeric amount');
    });

    it('should enforce minimum eligible threshold of ₹1,00,000', () => {
      assert.equal(validateAnnualIncome(50000), 'Minimum annual income for loan eligibility is ₹1,00,000');
    });

    it('should accept valid annual income amounts', () => {
      assert.equal(validateAnnualIncome(500000), '');
      assert.equal(validateAnnualIncome('1200000'), '');
    });
  });

  describe('Loan Amount & Cross-Field Validation', () => {
    it('should enforce minimum ₹10,000 and maximum limits', () => {
      assert.equal(validateLoanAmount(5000), 'Minimum loan request is ₹10,000');
      assert.equal(validateLoanAmount(60000000), 'Maximum loan request cannot exceed ₹5,00,00,000');
    });

    it('should enforce cross-field rule: Loan cannot exceed 10x Annual Income', () => {
      const annualIncome = 300000;
      // Max eligible = 300000 * 10 = 3,000,000
      const error = validateLoanAmount(3500000, annualIncome);
      assert.ok(error.includes('cannot exceed 10x annual income'));

      // Acceptable under 10x
      assert.equal(validateLoanAmount(2000000, annualIncome), '');
    });
  });

  describe('Full Form Validation & Problematic Field Detection', () => {
    it('should report isValid=true when all fields are valid', () => {
      const validForm = {
        fullName: 'Aniket Sarovar',
        email: 'aniket@example.com',
        phone: '9876543210',
        employmentStatus: 'salaried',
        annualIncome: '800000',
        loanAmount: '400000',
        loanPurpose: 'education',
        agreeToTerms: true
      };

      const result = validateFinancialForm(validForm);
      assert.equal(result.isValid, true);
      assert.equal(result.firstErrorField, null);
      assert.equal(Object.keys(result.errors).length, 0);
    });

    it('should detect the exact first problematic field for AI context', () => {
      const invalidForm = {
        fullName: '',
        email: 'invalid-email',
        phone: '123',
        employmentStatus: '',
        annualIncome: '50000',
        loanAmount: '0',
        loanPurpose: '',
        agreeToTerms: false
      };

      const result = validateFinancialForm(invalidForm);
      assert.equal(result.isValid, false);
      assert.equal(result.firstErrorField, 'fullName'); // First field in hierarchy
      assert.ok(result.errors.fullName);
    });
  });
});
