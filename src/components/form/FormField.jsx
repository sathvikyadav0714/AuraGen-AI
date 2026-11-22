import React from 'react';
import FormError from './FormError';

/**
 * FormField is an enhanced accessible input wrapper for AuraGen.
 * Features:
 * - Enterprise FinTech styling & responsive touch targets
 * - Live micro-telemetry feedback (dwell hesitation indicators)
 * - Visual valid/invalid states with vector SVGs
 * - Non-PII telemetry tagging (data-telemetry-field)
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
  isFocused = false,
  focusDurationMs = 0,
  min,
  max,
  step
}) {
  const isSelect = type === 'select';
  const hasError = Boolean(error);
  const inputId = id || name;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const isHesitant = isFocused && focusDurationMs >= 2000;

  // Determine status class
  let statusClass = 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20';
  if (hasError) {
    statusClass = 'input-error';
  } else if (isValid && value) {
    statusClass = 'input-success';
  } else if (isHesitant) {
    statusClass = 'border-amber-500/80 ring-2 ring-amber-500/20 bg-amber-950/10';
  }

  // Determine prefix padding so input text never overlaps adornments
  const prefixPaddingClass = prefix ? (prefix.length > 1 ? '!pl-16' : '!pl-11') : '';

  return (
    <div className="flex flex-col mb-4.5 sm:mb-5 group">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-300 uppercase tracking-wider select-none flex items-center gap-1.5"
        >
          <span>{label}</span>
          {required && <span className="text-rose-400 font-black" aria-hidden="true">*</span>}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Live Hesitation Telemetry Badge */}
          {isHesitant && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm">
              <svg className="w-2.5 h-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Hesitating ({(focusDurationMs / 1000).toFixed(1)}s)
            </span>
          )}

          {/* Validated Status Badge */}
          {isValid && value && !hasError && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-fadeIn shadow-2xs">
              <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              Valid
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-center">
        {/* Leading Prefix Adornment (e.g. ₹ or +91) */}
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10">
            <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-900 text-indigo-400 border border-slate-700/80 shadow-inner">
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
            className={`input-base cursor-pointer appearance-none pr-9 text-slate-100 ${prefixPaddingClass} ${statusClass}`}
          >
            <option value="" className="bg-slate-900 text-slate-400">{placeholder || 'Select an option...'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
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
            className={`input-base text-slate-100 ${prefixPaddingClass} ${isValid && value && !hasError ? 'pr-9' : ''} ${statusClass}`}
          />
        )}

        {/* Trailing Icon for Select */}
        {isSelect && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}

        {/* Trailing Valid Checkmark */}
        {!isSelect && isValid && value && !hasError && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-400 animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Trailing Error Exclamation Icon */}
        {!isSelect && hasError && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-rose-400 animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <svg className="w-3 h-3 text-rose-400 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
