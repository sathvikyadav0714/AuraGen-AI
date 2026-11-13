import React, { useState } from 'react';
import FormField from './form/FormField';

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

  // Field validation rules
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 3) {
          error = 'Name must be at least 3 characters';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Enter a valid email address (e.g. name@example.com)';
        }
        break;

      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) {
          error = 'Enter a valid 10-digit mobile number';
        }
        break;

      case 'employmentStatus':
        if (!value) {
          error = 'Please select your employment status';
        }
        break;

      case 'annualIncome':
        if (!value) {
          error = 'Annual income is required';
        } else if (Number(value) <= 0) {
          error = 'Income must be a positive number';
        } else if (Number(value) < 100000) {
          error = 'Minimum eligible annual income is ₹1,00,000';
        }
        break;

      case 'loanAmount':
        if (!value) {
          error = 'Loan amount is required';
        } else if (Number(value) <= 0) {
          error = 'Loan amount must be greater than zero';
        } else if (Number(value) < 10000) {
          error = 'Minimum loan request is ₹10,000';
        } else if (Number(value) > 50000000) {
          error = 'Maximum loan limit is ₹5,00,00,000';
        }
        break;

      case 'loanPurpose':
        if (!value) {
          error = 'Please specify your loan purpose';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: fieldValue };
      if (onFormChange) onFormChange(updated);
      return updated;
    });

    // Validate if field has already been touched
    if (touched[name]) {
      const fieldError = validateField(name, fieldValue);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
      if (fieldError && onValidationFriction) {
        onValidationFriction(name, fieldError);
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));

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

    // Run full validation
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key !== 'agreeToTerms') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms to proceed';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (onValidationFriction) {
        onValidationFriction('form_submission', 'Multiple validation errors on submit', Object.keys(newErrors));
      }
      return;
    }

    // Submit simulation
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSubmitSuccess) onSubmitSuccess(formData);
    }, 1200);
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Application Submitted!</h3>
        <p className="text-sm text-slate-500 mb-6">
          Thank you, <span className="font-semibold text-slate-700">{formData.fullName}</span>. Your financial loan application has been received and is under review.
        </p>
        <button
          onClick={() => {
            setFormData(INITIAL_FORM_STATE);
            setErrors({});
            setTouched({});
            setIsSubmitted(false);
          }}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          Submit Another Application
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Standard Financial Application</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Please fill in all requested details accurately to process your loan eligibility.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <FormField
          id="fullName"
          name="fullName"
          label="Full Legal Name"
          placeholder="e.g. Rahul Sharma"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.fullName ? errors.fullName : ''}
          required
        />

        <FormField
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="rahul@example.com"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email ? errors.email : ''}
          required
        />

        <FormField
          id="phone"
          name="phone"
          type="tel"
          label="Phone Number"
          placeholder="9876543210"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.phone ? errors.phone : ''}
          helperText="10-digit mobile number"
          required
        />

        <FormField
          id="employmentStatus"
          name="employmentStatus"
          type="select"
          label="Employment Status"
          placeholder="Choose your status"
          options={EMPLOYMENT_OPTIONS}
          value={formData.employmentStatus}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.employmentStatus ? errors.employmentStatus : ''}
          required
        />

        <FormField
          id="annualIncome"
          name="annualIncome"
          type="number"
          label="Annual Gross Income (₹)"
          placeholder="e.g. 650000"
          value={formData.annualIncome}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.annualIncome ? errors.annualIncome : ''}
          min="0"
          step="10000"
          required
        />

        <FormField
          id="loanAmount"
          name="loanAmount"
          type="number"
          label="Requested Loan Amount (₹)"
          placeholder="e.g. 250000"
          value={formData.loanAmount}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.loanAmount ? errors.loanAmount : ''}
          min="0"
          step="5000"
          required
        />
      </div>

      <FormField
        id="loanPurpose"
        name="loanPurpose"
        type="select"
        label="Purpose of Loan"
        placeholder="Select the primary purpose"
        options={LOAN_PURPOSE_OPTIONS}
        value={formData.loanPurpose}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.loanPurpose ? errors.loanPurpose : ''}
        required
      />

      <div className="mt-2 mb-6">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleChange}
            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-600 leading-snug">
            I confirm that the above financial details are correct and authorize credit score assessment.
          </span>
        </label>
        {touched.agreeToTerms && errors.agreeToTerms && (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.agreeToTerms}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            setFormData(INITIAL_FORM_STATE);
            setErrors({});
            setTouched({});
          }}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-2 rounded transition"
        >
          Reset Form
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>
    </form>
  );
}
