import React from 'react';

// TextInput
const TextInput = ({ label, name, value, onChange, placeholder, error }) => (
  <div className="mb-4">
    {label && <label className="label-text" htmlFor={name}>{label}</label>}
    <input
      className="input-field"
      type="text"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && <span className="error-text">{error}</span>}
  </div>
);

// NumberInput
const NumberInput = ({ label, name, value, onChange, placeholder, error }) => (
  <div className="mb-4">
    {label && <label className="label-text" htmlFor={name}>{label}</label>}
    <input
      className="input-field"
      type="number"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && <span className="error-text">{error}</span>}
  </div>
);

// EmailInput
const EmailInput = ({ label, name, value, onChange, placeholder, error }) => (
  <div className="mb-4">
    {label && <label className="label-text" htmlFor={name}>{label}</label>}
    <input
      className="input-field"
      type="email"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && <span className="error-text">{error}</span>}
  </div>
);

// PhoneInput
const PhoneInput = ({ label, name, value, onChange, placeholder, error }) => (
  <div className="mb-4">
    {label && <label className="label-text" htmlFor={name}>{label}</label>}
    <input
      className="input-field"
      type="tel"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
    />
    {error && <span className="error-text">{error}</span>}
  </div>
);

// SelectInput
const SelectInput = ({ label, name, value, onChange, options = [], error }) => (
  <div className="mb-4">
    {label && <label className="label-text" htmlFor={name}>{label}</label>}
    <select
      className="input-field"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
    >
      <option value="">-- Select --</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <span className="error-text">{error}</span>}
  </div>
);

// TextArea
const TextArea = ({ label, name, value, onChange, placeholder, error }) => (
  <div className="mb-4">
    {label && <label className="label-text" htmlFor={name}>{label}</label>}
    <textarea
      className="input-field"
      id={name}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={4}
    />
    {error && <span className="error-text">{error}</span>}
  </div>
);

// RadioGroup
const RadioGroup = ({ label, name, value, onChange, options = [] }) => (
  <div className="mb-4">
    {label && <span className="label-text block mb-1">{label}</span>}
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={onChange}
            className="accent-blue-600"
          />
          <span className="text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

// CheckboxGroup
const CheckboxGroup = ({ label, name, value = [], onChange, options = [] }) => {
  const handleChange = (optValue) => {
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue];
    // Simulate a synthetic event-like object
    onChange({ target: { name, value: next } });
  };

  return (
    <div className="mb-4">
      {label && <span className="label-text block mb-1">{label}</span>}
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={opt.value}
              checked={Array.isArray(value) && value.includes(opt.value)}
              onChange={() => handleChange(opt.value)}
              className="accent-blue-600"
            />
            <span className="text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// InfoBlock
const InfoBlock = ({ title, message }) => (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
    {title && <p className="font-semibold text-blue-800 mb-1">{title}</p>}
    {message && <p className="text-blue-700 text-sm">{message}</p>}
  </div>
);

// ProgressBar
const ProgressBar = ({ value = 0, label }) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="mb-4">
      {label && <span className="label-text block mb-1">{label}</span>}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 mt-1 inline-block">{clamped}%</span>
    </div>
  );
};

// Heading
const Heading = ({ text }) => (
  <h2 className="text-2xl font-bold text-gray-800 mb-2">{text}</h2>
);

// Paragraph
const Paragraph = ({ text }) => (
  <p className="text-gray-600 mb-2">{text}</p>
);

// Divider
const Divider = () => (
  <hr className="my-4 border-gray-200" />
);

// ─── Registry ────────────────────────────────────────────────────────────────

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

export function isAllowedComponent(type) {
  return type in COMPONENT_REGISTRY;
}

export function getComponent(type) {
  return COMPONENT_REGISTRY[type] || null;
}

export function getAllowedTypes() {
  return Object.keys(COMPONENT_REGISTRY);
}
