import React, { useState } from 'react';
import FormField from './form/FormField';
import { validateSingleField, validateFinancialForm } from '../utils/validation';

const EMPLOYMENT_OPTIONS = [
  { value: 'salaried', label: 'Salaried Professional' },
  { value: 'self_employed', label: 'Self Employed / Freelancer' },
  { value: 'business', label: 'Business Owner / Entrepreneur' },
  { value: 'student', label: 'Student' }
];

const LOAN_PURPOSE_OPTIONS = [
  { value: 'education', label: 'Higher Education' },
  { value: 'home', label: 'Home Purchase / Renovation' },
  { value: 'personal', label: 'Personal Emergency' },
  { value: 'business_expansion', label: 'Business Expansion' },
  { value: 'vehicle', label: 'Vehicle Loan' }
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

export default function FinancialForm({ onValidationFriction, onFormChange, onSubmitSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationAttempts, setValidationAttempts] = useState(0);

  const isFieldValid = (name) => {
    return Boolean(touched[name] && !errors[name] && formData[name]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const updatedForm = { ...formData, [name]: fieldValue };
    setFormData(updatedForm);

    if (onFormChange) {
      onFormChange(updatedForm);
    }

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
      if (onSubmitSuccess) {
        onSubmitSuccess(formData);
      }
    }, 1000);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setTouched({});
    setValidationAttempts(0);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border border-emerald-100 rounded-3xl p-8 sm:p-10 text-center shadow-sm animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1.5">Application Submitted Successfully!</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          Thank you, <span className="font-semibold text-slate-800">{formData.fullName}</span>. Your loan request for{' '}
          <span className="font-semibold text-indigo-600">₹{Number(formData.loanAmount).toLocaleString('en-IN')}</span> has passed validation and is forwarded to underwriting.
        </p>
        <button
          onClick={handleReset}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm transition-all">
      {/* Header with responsive Error status badge */}
      <div className="mb-8 border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Credit Assessment Form</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete the sections below to assess real-time credit eligibility.
          </p>
        </div>
        {validationAttempts > 0 && errorCount > 0 && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {errorCount} {errorCount === 1 ? 'Error' : 'Errors'} to Resolve
          </span>
        )}
      </div>

      <div className="space-y-7">
        {/* Section 1: Applicant Details */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">1</span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Applicant Information</h3>
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
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">2</span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Financial Assessment</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField
              id="employmentStatus"
              name="employmentStatus"
              type="select"
              label="Employment Status"
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
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">3</span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Loan Request</h3>
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
              label="Loan Purpose"
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
        <div className="pt-3 border-t border-slate-100">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I certify that all stated financial and personal information is accurate, and I authorize AuraGen to perform automated risk profiling.
            </span>
          </label>
          {touched.agreeToTerms && errors.agreeToTerms && (
            <p className="mt-2 text-xs text-rose-600 font-medium animate-fadeIn">{errors.agreeToTerms}</p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={handleReset}
          className="w-full sm:w-auto text-xs text-slate-500 hover:text-slate-900 font-semibold px-4 py-2.5 rounded-lg hover:bg-slate-50 transition text-center"
        >
          Reset Application
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying & Submitting...
            </span>
          ) : (
            'Submit Application →'
          )}
        </button>
      </div>
    </form>
  );
}
