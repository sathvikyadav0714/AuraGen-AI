import React, { useState, useEffect } from 'react';
import FormField from './form/FormField';
import { validateSingleField, validateFinancialForm } from '../utils/validation';
import {
  saveDraftFormData,
  loadDraftFormData,
  clearDraftFormData,
  calculateFormProgress,
  extractFormContext
} from '../utils/formContext';

const EMPLOYMENT_OPTIONS = [
  { value: 'salaried', label: '💼 Salaried Professional' },
  { value: 'self_employed', label: '💻 Self Employed / Freelancer' },
  { value: 'business', label: '🏢 Business Owner / Entrepreneur' },
  { value: 'student', label: '🎓 Student' }
];

const LOAN_PURPOSE_OPTIONS = [
  { value: 'education', label: '🎓 Higher Education' },
  { value: 'home', label: '🏡 Home Purchase / Renovation' },
  { value: 'personal', label: '🛡️ Personal Emergency' },
  { value: 'business_expansion', label: '🚀 Business Expansion' },
  { value: 'vehicle', label: '🚗 Vehicle Loan' }
];

const INITIAL_FORM_STATE = {
  fullName: '',
  email: '',
  phone: '',
  employmentStatus: '',
  annualIncome: '',
  loanAmount: '',
  loanPurpose: '',
  agreeToTerms: false
};

export default function FinancialForm({
  onValidationFriction,
  onFormChange,
  onSubmitSuccess,
  onContextExtracted
}) {
  // Initialize state with stored session draft if available
  const [formData, setFormData] = useState(() => {
    const draft = loadDraftFormData();
    return draft ? { ...INITIAL_FORM_STATE, ...draft } : INITIAL_FORM_STATE;
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationAttempts, setValidationAttempts] = useState(0);

  // Compute live form completion progress
  const progress = calculateFormProgress(formData);

  // Auto-persist draft when user types
  useEffect(() => {
    saveDraftFormData(formData);
    if (onFormChange) {
      onFormChange(formData);
    }
  }, [formData, onFormChange]);

  const isFieldValid = (name) => {
    return Boolean(touched[name] && !errors[name] && formData[name]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const updatedForm = { ...formData, [name]: fieldValue };
    setFormData(updatedForm);

    // Real-time re-validation for touched fields
    if (touched[name]) {
      const fieldError = validateSingleField(name, fieldValue, updatedForm);
      setErrors((prev) => {
        const next = { ...prev, [name]: fieldError };
        if (!fieldError) delete next[name];
        return next;
      });

      // Cross-validation check for loan vs income
      if (name === 'annualIncome' && touched.loanAmount && formData.loanAmount) {
        const loanErr = validateSingleField('loanAmount', formData.loanAmount, updatedForm);
        setErrors((prev) => {
          const next = { ...prev, loanAmount: loanErr };
          if (!loanErr) delete next.loanAmount;
          return next;
        });
      }

      if (fieldError && onValidationFriction) {
        onValidationFriction(name, fieldError);
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldError = validateSingleField(name, value, formData);
    setErrors((prev) => {
      const next = { ...prev, [name]: fieldError };
      if (!fieldError) delete next[name];
      return next;
    });

    if (fieldError && onValidationFriction) {
      onValidationFriction(name, fieldError);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(INITIAL_FORM_STATE).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Run modular validation engine
    const { isValid, errors: validationErrors, firstErrorField } = validateFinancialForm(formData);
    setErrors(validationErrors);
    setValidationAttempts((prev) => prev + 1);

    // Extract rich AI form context
    const fullContext = extractFormContext(formData, validationErrors, {
      problematicField: firstErrorField,
      cognitiveScore: isValid ? 15 : 70
    });

    if (onContextExtracted) {
      onContextExtracted(fullContext);
    }

    if (!isValid) {
      if (onValidationFriction) {
        onValidationFriction(
          firstErrorField,
          validationErrors[firstErrorField],
          Object.keys(validationErrors)
        );
      }
      return;
    }

    // Submit simulation
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      clearDraftFormData();
      if (onSubmitSuccess) {
        onSubmitSuccess(formData, fullContext);
      }
    }, 1000);
  };

  const handleReset = () => {
    clearDraftFormData();
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setTouched({});
    setValidationAttempts(0);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-emerald-100 rounded-3xl p-8 sm:p-12 text-center shadow-xl shadow-emerald-500/5 animate-fadeIn">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/25">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
          ✨ Verified & Submitted
        </span>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Application Approved for Review!</h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
          Congratulations, <span className="font-bold text-slate-900">{formData.fullName}</span>! Your requested credit facility of{' '}
          <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            ₹{Number(formData.loanAmount).toLocaleString('en-IN')}
          </span>{' '}
          has been securely transferred to the underwriting desk.
        </p>
        <button
          onClick={handleReset}
          className="px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-9 md:p-11 shadow-[0_12px_40px_rgb(0,0,0,0.05)] ring-1 ring-slate-900/5 transition-all overflow-hidden"
    >
      {/* Top Colorful Accent Line */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-pink-500" />

      {/* Header with vibrant badges */}
      <div className="mb-6 border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              🔒 Bank-Grade Security
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
              ⚡ Instant Eligibility
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Credit Assessment Form</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete the 3 quick steps below to calculate your personalized loan offer.
          </p>
        </div>

        {validationAttempts > 0 && errorCount > 0 && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full animate-fadeIn shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            {errorCount} {errorCount === 1 ? 'Error' : 'Errors'} to Fix
          </span>
        )}
      </div>

      {/* Vibrant Gradient Progress Bar */}
      <div className="mb-8 p-4 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-pink-50/50 rounded-2xl border border-indigo-100/60">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <span className="text-indigo-600 font-extrabold">📊</span> Completion Progress
          </span>
          <span className="font-mono font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-100 shadow-2xs">
            {progress.completedCount} of {progress.totalCount} fields ({progress.percentage}%)
          </span>
        </div>
        <div className="w-full bg-white/80 rounded-full h-2.5 p-0.5 shadow-inner border border-indigo-100/40">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1: Applicant Details */}
        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-500/25">
              1
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Applicant Identity</h3>
              <p className="text-[11px] text-slate-400">Your legal name and contact coordinates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div className="sm:col-span-2">
              <FormField
                id="fullName"
                name="fullName"
                label="Full Legal Name"
                placeholder="e.g. Priya Sharma"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.fullName ? errors.fullName : ''}
                isValid={isFieldValid('fullName')}
                required
              />
            </div>

            <FormField
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="priya@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
              isValid={isFieldValid('email')}
              required
            />

            <FormField
              id="phone"
              name="phone"
              type="tel"
              label="Mobile Number"
              placeholder="9876543210"
              prefix="+91"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone ? errors.phone : ''}
              isValid={isFieldValid('phone')}
              helperText="10-digit primary mobile"
              required
            />
          </div>
        </div>

        {/* Section 2: Income & Employment */}
        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-500/25">
              2
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Financial Assessment</h3>
              <p className="text-[11px] text-slate-400">Source of income and monthly stability</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField
              id="employmentStatus"
              name="employmentStatus"
              type="select"
              label="Employment Category"
              placeholder="Select your category"
              options={EMPLOYMENT_OPTIONS}
              value={formData.employmentStatus}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.employmentStatus ? errors.employmentStatus : ''}
              isValid={isFieldValid('employmentStatus')}
              required
            />

            <FormField
              id="annualIncome"
              name="annualIncome"
              type="number"
              label="Annual Gross Income"
              placeholder="e.g. 600000"
              prefix="₹"
              value={formData.annualIncome}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.annualIncome ? errors.annualIncome : ''}
              isValid={isFieldValid('annualIncome')}
              min="100000"
              step="10000"
              helperText="Minimum eligible income: ₹1,00,000"
              required
            />
          </div>
        </div>

        {/* Section 3: Loan Parameters */}
        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/25">
              3
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Loan Request Details</h3>
              <p className="text-[11px] text-slate-400">Required principal and usage purpose</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField
              id="loanAmount"
              name="loanAmount"
              type="number"
              label="Requested Loan Amount"
              placeholder="e.g. 250000"
              prefix="₹"
              value={formData.loanAmount}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.loanAmount ? errors.loanAmount : ''}
              isValid={isFieldValid('loanAmount')}
              min="10000"
              max="50000000"
              step="5000"
              helperText="Cannot exceed 10x Annual Income"
              required
            />

            <FormField
              id="loanPurpose"
              name="loanPurpose"
              type="select"
              label="Purpose of Loan"
              placeholder="Select primary purpose"
              options={LOAN_PURPOSE_OPTIONS}
              value={formData.loanPurpose}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.loanPurpose ? errors.loanPurpose : ''}
              isValid={isFieldValid('loanPurpose')}
              required
            />
          </div>
        </div>

        {/* Section 4: Declaration */}
        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-amber-950 leading-relaxed font-medium">
              I certify that all stated financial and personal information is accurate, and I authorize AuraGen to perform automated risk profiling.
            </span>
          </label>
          {touched.agreeToTerms && errors.agreeToTerms && (
            <p className="mt-2 text-xs text-rose-600 font-bold animate-fadeIn">{errors.agreeToTerms}</p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-7 mt-8 border-t border-slate-100">
        <button
          type="button"
          onClick={handleReset}
          className="w-full sm:w-auto text-xs text-slate-500 hover:text-slate-900 font-bold px-4 py-3 rounded-xl hover:bg-slate-100/80 transition text-center"
        >
          ↺ Reset Application
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying & Processing...
            </span>
          ) : (
            <>
              <span>Submit Application</span>
              <span>⚡</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
