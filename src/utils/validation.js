/**
 * AuraGen - Financial Form Validation Engine
 * 
 * This module enforces strict validation rules for the original financial application.
 * It also detects the first problematic field to feed Member 3's AI prompt context.
 */

// Regex patterns
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;

// Repeating digit checker (e.g. 9999999999, 0000000000)
const isRepeatingSequence = (str) => /^(\d)\1{9}$/.test(str);

/**
 * Validates Full Name
 */
export function validateFullName(name) {
  if (!name || !name.trim()) {
    return 'Full legal name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return 'Name must contain at least 3 characters';
  }
  if (trimmed.length > 80) {
    return 'Name cannot exceed 80 characters';
  }
  if (!NAME_REGEX.test(trimmed)) {
    return 'Name should only contain letters and spaces';
  }
  return '';
}

/**
 * Validates Email Address
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email address is required';
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address (e.g., rahul@example.com)';
  }
  return '';
}

/**
 * Validates Mobile Phone Number (10 digits)
 */
export function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return 'Mobile phone number is required';
  }
  // Remove spaces, hyphens, and +91 prefix if entered
  const cleaned = phone.replace(/\D/g, '').replace(/^91(?=\d{10})/, '');

  if (cleaned.length !== 10) {
    return 'Mobile number must be exactly 10 digits';
  }
  if (!PHONE_REGEX.test(cleaned)) {
    return 'Mobile number must start with 6, 7, 8, or 9';
  }
  if (isRepeatingSequence(cleaned)) {
    return 'Please enter a legitimate phone number';
  }
  return '';
}

/**
 * Validates Employment Status
 */
export function validateEmploymentStatus(status) {
  const allowed = ['salaried', 'self_employed', 'business', 'student'];
  if (!status) {
    return 'Please select your current employment status';
  }
  if (!allowed.includes(status)) {
    return 'Please select a valid employment category';
  }
  return '';
}

/**
 * Validates Annual Income
 */
export function validateAnnualIncome(income) {
  if (income === undefined || income === null || income === '') {
    return 'Annual gross income is required';
  }
  const num = Number(income);
  if (isNaN(num)) {
    return 'Income must be a valid numeric amount';
  }
  if (num <= 0) {
    return 'Annual income must be greater than ₹0';
  }
  if (num < 100000) {
    return 'Minimum annual income for loan eligibility is ₹1,00,000';
  }
  if (num > 500000000) {
    return 'Income exceeds maximum processing limit';
  }
  return '';
}

/**
 * Validates Requested Loan Amount
 */
export function validateLoanAmount(loanAmount, annualIncome) {
  if (loanAmount === undefined || loanAmount === null || loanAmount === '') {
    return 'Requested loan amount is required';
  }
  const num = Number(loanAmount);
  if (isNaN(num)) {
    return 'Loan amount must be a valid numeric amount';
  }
  if (num <= 0) {
    return 'Loan amount must be greater than ₹0';
  }
  if (num < 10000) {
    return 'Minimum loan request is ₹10,000';
  }
  if (num > 50000000) {
    return 'Maximum loan request cannot exceed ₹5,00,00,000';
  }

  // Cross-field validation: Loan shouldn't exceed 10x gross annual income
  if (annualIncome && Number(annualIncome) > 0) {
    const maxEligible = Number(annualIncome) * 10;
    if (num > maxEligible) {
      return `Loan amount cannot exceed 10x annual income (Max: ₹${maxEligible.toLocaleString('en-IN')})`;
    }
  }

  return '';
}

/**
 * Validates Loan Purpose
 */
export function validateLoanPurpose(purpose) {
  if (!purpose) {
    return 'Please specify the primary purpose of this loan';
  }
  return '';
}

/**
 * Validates Terms Agreement
 */
export function validateTermsAgreement(agreed) {
  if (!agreed) {
    return 'You must agree to the credit assessment terms to proceed';
  }
  return '';
}

/**
 * Real-time validator for a single field
 */
export function validateSingleField(name, value, allValues = {}) {
  switch (name) {
    case 'fullName':
      return validateFullName(value);
    case 'email':
      return validateEmail(value);
    case 'phone':
      return validatePhone(value);
    case 'employmentStatus':
      return validateEmploymentStatus(value);
    case 'annualIncome':
      return validateAnnualIncome(value);
    case 'loanAmount':
      return validateLoanAmount(value, allValues.annualIncome);
    case 'loanPurpose':
      return validateLoanPurpose(value);
    case 'agreeToTerms':
      return validateTermsAgreement(value);
    default:
      return '';
  }
}

/**
 * Validates the entire Financial Form and returns error details
 * 
 * @param {Object} formData
 * @returns {{ isValid: boolean, errors: Object, firstErrorField: string|null }}
 */
export function validateFinancialForm(formData) {
  const errors = {};

  const fields = [
    'fullName',
    'email',
    'phone',
    'employmentStatus',
    'annualIncome',
    'loanAmount',
    'loanPurpose',
    'agreeToTerms'
  ];

  fields.forEach((field) => {
    const error = validateSingleField(field, formData[field], formData);
    if (error) {
      errors[field] = error;
    }
  });

  const errorKeys = Object.keys(errors);
  const isValid = errorKeys.length === 0;

  return {
    isValid,
    errors,
    firstErrorField: isValid ? null : errorKeys[0]
  };
}
