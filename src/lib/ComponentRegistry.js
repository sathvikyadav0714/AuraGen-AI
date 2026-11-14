import React from 'react';

/* ─── Shared micro-components ──────────────────────────────── */

const FieldWrap = ({ children }) => (
  <div className="flex flex-col gap-1 mb-5">{children}</div>
);

const Label = ({ name, text }) =>
  text ? <label className="label-text" htmlFor={name}>{text}</label> : null;

const ErrorMsg = ({ msg }) =>
  msg ? (
    <span className="error-text">
      <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
      </svg>
      {msg}
    </span>
  ) : null;

/* ─── Input components ─────────────────────────────────────── */

const TextInput = ({ label, name, value, onChange, placeholder, error }) => (
  <FieldWrap>
    <Label name={name} text={label} />
    <input
      className={`input-field ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
      type="text" id={name} name={name}
      value={value ?? ''} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
    <ErrorMsg msg={error} />
  </FieldWrap>
);

const NumberInput = ({ label, name, value, onChange, placeholder, error }) => (
  <FieldWrap>
    <Label name={name} text={label} />
    <input
      className={`input-field ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
      type="number" id={name} name={name}
      value={value ?? ''} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
    <ErrorMsg msg={error} />
  </FieldWrap>
);

const EmailInput = ({ label, name, value, onChange, placeholder, error }) => (
  <FieldWrap>
    <Label name={name} text={label} />
    <input
      className={`input-field ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
      type="email" id={name} name={name}
      value={value ?? ''} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
    <ErrorMsg msg={error} />
  </FieldWrap>
);

const PhoneInput = ({ label, name, value, onChange, placeholder, error }) => (
  <FieldWrap>
    <Label name={name} text={label} />
    <input
      className={`input-field ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
      type="tel" id={name} name={name}
      value={value ?? ''} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
    <ErrorMsg msg={error} />
  </FieldWrap>
);

const SelectInput = ({ label, name, value, onChange, options = [], error }) => (
  <FieldWrap>
    <Label name={name} text={label} />
    <div className="relative">
      <select
        className={`input-field appearance-none pr-10 cursor-pointer ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
        id={name} name={name} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select an option…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    <ErrorMsg msg={error} />
  </FieldWrap>
);

const TextArea = ({ label, name, value, onChange, placeholder, error }) => (
  <FieldWrap>
    <Label name={name} text={label} />
    <textarea
      className={`input-field resize-none ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
      id={name} name={name} rows={4}
      value={value ?? ''} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
    <ErrorMsg msg={error} />
  </FieldWrap>
);

const RadioGroup = ({ label, name, value, onChange, options = [], error }) => (
  <FieldWrap>
    <Label name={name} text={label} />
    <div className="flex flex-col gap-2 mt-1">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150
            ${value === opt.value
              ? 'border-blue-400 bg-blue-50/60 shadow-sm'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
        >
          <input
            type="radio" name={name} value={opt.value}
            checked={value === opt.value}
            onChange={(e) => onChange(e.target.value)}
            className="accent-blue-600 w-4 h-4"
          />
          <span className={`text-sm font-medium ${value === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
    <ErrorMsg msg={error} />
  </FieldWrap>
);

const CheckboxGroup = ({ label, name, value = [], onChange, options = [], error }) => {
  const handleChange = (optValue) => {
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue];
    onChange(next);
  };
  return (
    <FieldWrap>
      <Label name={name} text={label} />
      <div className="flex flex-col gap-2 mt-1">
        {options.map((opt) => {
          const checked = Array.isArray(value) && value.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150
                ${checked ? 'border-blue-400 bg-blue-50/60 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
            >
              <input
                type="checkbox" name={name} value={opt.value}
                checked={checked}
                onChange={() => handleChange(opt.value)}
                className="accent-blue-600 w-4 h-4 rounded"
              />
              <span className={`text-sm font-medium ${checked ? 'text-blue-700' : 'text-gray-700'}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
      <ErrorMsg msg={error} />
    </FieldWrap>
  );
};

const InfoBlock = ({ title, message }) => (
  <div className="info-block mb-5">
    <svg className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
    </svg>
    <div>
      {title && <p className="font-semibold text-blue-800 text-xs mb-0.5">{title}</p>}
      {message && <p className="text-blue-700 text-xs leading-relaxed">{message}</p>}
    </div>
  </div>
);

const ProgressBar = ({ value = 0, label }) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="mb-5">
      {label && <span className="label-text">{label}</span>}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-gray-400 mt-1 inline-block">{clamped}%</span>
    </div>
  );
};

const Heading = ({ text }) => (
  <h2 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">{text}</h2>
);

const Paragraph = ({ text }) => (
  <p className="text-sm text-gray-500 leading-relaxed mb-3">{text}</p>
);

const Divider = () => (
  <hr className="my-5 border-gray-100" />
);

// ─── Registry & Metadata ───────────────────────────────────────────────────

/**
 * Metadata dictionary describing supported capabilities for each UI primitive
 */
export const COMPONENT_METADATA = {
  TextInput: { category: 'input', supportedTypes: ['text'], hasLabel: true },
  NumberInput: { category: 'input', supportedTypes: ['number'], hasLabel: true },
  EmailInput: { category: 'input', supportedTypes: ['email'], hasLabel: true },
  PhoneInput: { category: 'input', supportedTypes: ['tel'], hasLabel: true },
  SelectInput: { category: 'selection', hasOptions: true, hasLabel: true },
  TextArea: { category: 'input', multiline: true, hasLabel: true },
  RadioGroup: { category: 'selection', hasOptions: true, hasLabel: true },
  CheckboxGroup: { category: 'selection', hasOptions: true, multiple: true, hasLabel: true },
  InfoBlock: { category: 'display', contextual: true },
  ProgressBar: { category: 'display', metric: true },
  Heading: { category: 'typography', level: 2 },
  Paragraph: { category: 'typography' },
  Divider: { category: 'layout' },
};

export const COMPONENT_REGISTRY = {
  TextInput,
  NumberInput,
  EmailInput,
  PhoneInput,
  SelectInput,
  TextArea,
  RadioGroup,
  CheckboxGroup,
  InfoBlock,
  ProgressBar,
  Heading,
  Paragraph,
  Divider,
};

/**
 * Validates whether a component type exists in the registry allowlist
 * @param {string} type
 * @returns {boolean}
 */
export function isAllowedComponent(type) {
  return Boolean(type && Object.prototype.hasOwnProperty.call(COMPONENT_REGISTRY, type));
}

/**
 * Retrieves the React component matching the given type string
 * @param {string} type
 * @returns {React.ComponentType|null}
 */
export function getComponent(type) {
  return COMPONENT_REGISTRY[type] || null;
}

/**
 * Returns all allowed component types in the registry
 * @returns {string[]}
 */
export function getAllowedTypes() {
  return Object.keys(COMPONENT_REGISTRY);
}

/**
 * Retrieves schema metadata for an allowed component
 * @param {string} type
 * @returns {object|null}
 */
export function getComponentMetadata(type) {
  return COMPONENT_METADATA[type] || null;
}
