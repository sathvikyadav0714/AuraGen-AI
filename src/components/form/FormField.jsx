import React from 'react';
import FormError from './FormError';

/**
 * FormField is a reusable input wrapper with label, accessible error display,
 * and telemetry attributes for behavioral tracking.
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
  min,
  max,
  step
}) {
  const isSelect = type === 'select';
  const hasError = Boolean(error);
  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="flex flex-col mb-4">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
      >
        {label}
        {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
      </label>

      <div className="relative">
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
            className={`input-base cursor-pointer appearance-none pr-9 ${hasError ? 'input-error' : ''}`}
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
            className={`input-base ${hasError ? 'input-error' : ''}`}
          />
        )}

        {isSelect && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p id={helperId} className="mt-1 text-[11px] text-slate-400">{helperText}</p>
      )}

      <div id={errorId}>
        <FormError error={error} />
      </div>
    </div>
  );
}
