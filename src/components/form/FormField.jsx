import React from 'react';
import FormError from './FormError';

/**
 * FormField is an enhanced accessible input wrapper.
 * Features:
 * - Responsive touch target styling
 * - Visual valid/invalid states with animated icons
 * - Colorful currency / phone adornments
 * - Telemetry tracking hooks (data-telemetry-field)
 */
export default function FormField({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  options = [],
  helperText = '',
  disabled = false,
  prefix = '',
  isValid = false,
  min,
  max,
  step
}) {
  const isSelect = type === 'select';
  const hasError = Boolean(error);
  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  // Determine status class
  let statusClass = 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20';
  if (hasError) {
    statusClass = 'input-error';
  } else if (isValid && value) {
    statusClass = 'input-success';
  }

  return (
    <div className="flex flex-col mb-4.5 sm:mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider select-none"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold" aria-hidden="true">*</span>}
        </label>
        {isValid && value && !hasError && (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1 animate-fadeIn shadow-2xs">
            <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            Valid
          </span>
        )}
      </div>

      <div className="relative flex items-center group">
        {/* Leading Prefix Adornment (e.g. ₹ or +91) with colorful styling */}
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none select-none">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {prefix}
            </span>
          </div>
        )}

        {isSelect ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            data-telemetry-field={name}
            className={`input-base cursor-pointer appearance-none pr-9 text-slate-800 ${prefix ? 'pl-14' : ''} ${statusClass}`}
          >
            <option value="">{placeholder || 'Select an option...'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
            data-telemetry-field={name}
            className={`input-base text-slate-800 ${prefix ? 'pl-14' : ''} ${isValid && value && !hasError ? 'pr-9' : ''} ${statusClass}`}
          />
        )}

        {/* Trailing Icon for Select */}
        {isSelect && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-indigo-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Trailing Valid Checkmark */}
        {!isSelect && isValid && value && !hasError && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-500 animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Trailing Error Exclamation Icon */}
        {!isSelect && hasError && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-rose-500 animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-rose-600 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p id={helperId} className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
          <span className="text-indigo-400">●</span>
          <span>{helperText}</span>
        </p>
      )}

      <div id={errorId}>
        <FormError error={error} />
      </div>
    </div>
  );
}
