/**
 * AuraGen - Form Context & State Persistence Engine
 * 
 * Provides:
 * 1. Form context extraction formatted for Member 3's Generative AI prompts.
 * 2. Form state preservation so users never lose entered data when transitioning
 *    between the standard form and Member 4's conversational wizard.
 * 3. Local session storage backup with safe fallbacks.
 */

const STORAGE_KEY = 'auragen_financial_form_draft';

/**
 * Persists current form data to session storage
 * 
 * @param {Object} formData 
 */
export function saveDraftFormData(formData) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  } catch (err) {
    console.warn('AuraGen: Unable to persist form draft to sessionStorage:', err);
  }
}

/**
 * Retrieves persisted form data from session storage
 * 
 * @returns {Object|null}
 */
export function loadDraftFormData() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (err) {
    console.warn('AuraGen: Unable to read form draft from sessionStorage:', err);
  }
  return null;
}

/**
 * Clears stored draft form data
 */
export function clearDraftFormData() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('AuraGen: Unable to clear form draft:', err);
  }
}

/**
 * Calculates form completion progress and fields
 * 
 * @param {Object} formData 
 * @returns {{ completedCount: number, totalCount: number, percentage: number }}
 */
export function calculateFormProgress(formData = {}) {
  const coreFields = [
    'fullName',
    'email',
    'phone',
    'employmentStatus',
    'annualIncome',
    'loanAmount',
    'loanPurpose'
  ];

  let completedCount = 0;
  coreFields.forEach((key) => {
    const val = formData[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      completedCount++;
    }
  });

  const totalCount = coreFields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percentage
  };
}

/**
 * Extracts structured form context conforming to AuraGen team contracts
 * (Matches Member 3 AI prompt inputs and Member 4 preserved data)
 * 
 * @param {Object} formData - Current form inputs
 * @param {Object} errors - Current validation errors
 * @param {Object} frictionMeta - Detected friction metadata (e.g. from useTelemetry)
 * @returns {Object}
 */
export function extractFormContext(formData = {}, errors = {}, frictionMeta = {}) {
  const errorKeys = Object.keys(errors).filter((k) => Boolean(errors[k]));
  const hasErrors = errorKeys.length > 0;
  const problematicField = frictionMeta.problematicField || (hasErrors ? errorKeys[0] : null);

  let frictionDetails = frictionMeta.details || '';
  if (!frictionDetails && problematicField) {
    frictionDetails = `User encountered validation difficulty on field "${problematicField}": ${errors[problematicField] || 'Repeated hesitation/errors'}`;
  } else if (!frictionDetails) {
    frictionDetails = 'Standard form interaction in progress.';
  }

  const progress = calculateFormProgress(formData);

  return {
    // Member 3 (Gowri) AI prompt schema contract
    formContext: {
      cognitiveLoadScore: frictionMeta.cognitiveScore || 0,
      problematicField: problematicField || 'None',
      frictionDetails: frictionDetails,
      formData: {
        fullName: formData.fullName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        employmentStatus: formData.employmentStatus || '',
        annualIncome: formData.annualIncome || '',
        loanAmount: formData.loanAmount || '',
        loanPurpose: formData.loanPurpose || ''
      }
    },

    // Progress metrics
    progress,

    // Metadata
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Member 1 - FinancialForm',
      hasActiveErrors: hasErrors,
      errorCount: errorKeys.length
    }
  };
}
