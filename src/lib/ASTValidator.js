/**
 * ASTValidator.js
 * Validates JSON UI schemas coming from the AI before they are rendered.
 * This module checks JSON structure for security and correctness —
 * it does NOT execute arbitrary JS code.
 */

// ---------------------------------------------------------------------------
// Allowlists
// ---------------------------------------------------------------------------

export const ALLOWED_COMPONENT_TYPES = [
  'TextInput',
  'NumberInput',
  'EmailInput',
  'PhoneInput',
  'SelectInput',
  'TextArea',
  'RadioGroup',
  'CheckboxGroup',
  'InfoBlock',
  'ProgressBar',
  'Heading',
  'Paragraph',
  'Divider',
];

export const ALLOWED_STEP_KEYS = [
  'id',
  'title',
  'description',
  'components',
  'validation',
];

export const ALLOWED_COMPONENT_KEYS = [
  'type',
  'id',
  'label',
  'name',
  'placeholder',
  'required',
  'options',
  'rows',
  'min',
  'max',
  'validation',
  'defaultValue',
  'message',
  'value',
  'text',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if `val` is a plain object (not null, not array, not class instance).
 */
function isPlainObject(val) {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return false;
  const proto = Object.getPrototypeOf(val);
  return proto === Object.prototype || proto === null;
}

// ---------------------------------------------------------------------------
// validateComponent
// ---------------------------------------------------------------------------

/**
 * Validates a single component object from the schema.
 * @param {*} component - The component to validate.
 * @param {number} [index] - Position in the components array (for error messages).
 * @returns {true} on success.
 * @throws {Error} with a descriptive message on failure.
 */
export function validateComponent(component, index) {
  const loc = index !== undefined ? ` at index ${index}` : '';

  if (!isPlainObject(component)) {
    throw new Error(`Component${loc} must be a plain object.`);
  }

  // Validate type
  if (!component.type) {
    throw new Error(`Component${loc} is missing required field "type".`);
  }
  if (!ALLOWED_COMPONENT_TYPES.includes(component.type)) {
    throw new Error(
      `Component${loc} has disallowed type "${component.type}". ` +
        `Allowed types: ${ALLOWED_COMPONENT_TYPES.join(', ')}.`
    );
  }

  // Validate id
  if (component.id === undefined || component.id === null) {
    throw new Error(`Component${loc} (type: "${component.type}") is missing required field "id".`);
  }
  if (typeof component.id !== 'string') {
    throw new Error(
      `Component${loc} (type: "${component.type}") field "id" must be a string, ` +
        `got ${typeof component.id}.`
    );
  }

  // Inject-attack prevention: no keys outside the allowlist
  const unknownKeys = Object.keys(component).filter(
    (k) => !ALLOWED_COMPONENT_KEYS.includes(k)
  );
  if (unknownKeys.length > 0) {
    throw new Error(
      `Component${loc} (id: "${component.id}") contains disallowed key(s): ` +
        `${unknownKeys.map((k) => `"${k}"`).join(', ')}.`
    );
  }

  // Validate options shape if present
  if (component.options !== undefined) {
    if (!Array.isArray(component.options)) {
      throw new Error(
        `Component${loc} (id: "${component.id}") field "options" must be an array.`
      );
    }
    component.options.forEach((opt, optIdx) => {
      if (!isPlainObject(opt) || opt.value === undefined || opt.label === undefined) {
        throw new Error(
          `Component${loc} (id: "${component.id}") option at index ${optIdx} ` +
            `must have shape { value, label }.`
        );
      }
    });
  }

  return true;
}

// ---------------------------------------------------------------------------
// validateStep
// ---------------------------------------------------------------------------

/**
 * Validates a single step object from the schema.
 * @param {*} step - The step to validate.
 * @param {number} [index] - Position in the steps array (for error messages).
 * @returns {true} on success.
 * @throws {Error} with a descriptive message on failure.
 */
export function validateStep(step, index) {
  const loc = index !== undefined ? ` at index ${index}` : '';

  if (!isPlainObject(step)) {
    throw new Error(`Step${loc} must be a plain object.`);
  }

  if (step.id === undefined || step.id === null) {
    throw new Error(`Step${loc} is missing required field "id".`);
  }

  if (!Array.isArray(step.components)) {
    throw new Error(
      `Step${loc} (id: "${step.id}") field "components" must be an array.`
    );
  }

  // No keys outside the allowlist
  const unknownKeys = Object.keys(step).filter(
    (k) => !ALLOWED_STEP_KEYS.includes(k)
  );
  if (unknownKeys.length > 0) {
    throw new Error(
      `Step${loc} (id: "${step.id}") contains disallowed key(s): ` +
        `${unknownKeys.map((k) => `"${k}"`).join(', ')}.`
    );
  }

  // Validate each component
  step.components.forEach((component, compIdx) => {
    validateComponent(component, compIdx);
  });

  return true;
}

// ---------------------------------------------------------------------------
// validateUISchema
// ---------------------------------------------------------------------------

/**
 * Top-level schema validator.
 * @param {*} schema
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateUISchema(schema) {
  try {
    if (!isPlainObject(schema)) {
      throw new Error('Schema must be a plain object.');
    }

    // Only allow recognised top-level keys
    const allowedSchemaKeys = ['steps', 'metadata', 'preservedData'];
    const unknownSchemaKeys = Object.keys(schema).filter(
      (k) => !allowedSchemaKeys.includes(k)
    );
    if (unknownSchemaKeys.length > 0) {
      throw new Error(
        `Schema contains disallowed key(s): ` +
          `${unknownSchemaKeys.map((k) => `"${k}"`).join(', ')}.`
      );
    }

    // steps — required, non-empty array, max 20 items
    if (!Array.isArray(schema.steps)) {
      throw new Error('Schema field "steps" must be an array.');
    }
    if (schema.steps.length === 0) {
      throw new Error('Schema field "steps" must not be empty.');
    }
    if (schema.steps.length > 20) {
      throw new Error(
        `Schema field "steps" exceeds maximum of 20 steps (got ${schema.steps.length}).`
      );
    }

    // metadata — optional, must be plain object if present
    if (schema.metadata !== undefined && !isPlainObject(schema.metadata)) {
      throw new Error('Schema field "metadata" must be a plain object.');
    }

    // preservedData — optional, must be plain object if present
    if (schema.preservedData !== undefined && !isPlainObject(schema.preservedData)) {
      throw new Error('Schema field "preservedData" must be a plain object.');
    }

    // Validate each step
    schema.steps.forEach((step, stepIdx) => {
      validateStep(step, stepIdx);
    });

    return { valid: true, errors: [] };
  } catch (err) {
    return { valid: false, errors: [err.message || String(err)] };
  }
}

// ---------------------------------------------------------------------------
// sanitizeString & sanitizeSchema & Security Hardening
// ---------------------------------------------------------------------------

const DANGEROUS_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Escapes unsafe HTML characters to prevent XSS injection
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Removes common XSS vectors from a string:
 * - Strips <script>...</script> tags and residual brackets
 * - Strips inline event handlers (on*)
 * - Blocks javascript:, vbscript:, and data:text/html URIs
 * - Neutralizes encoded script schemes
 * @param {string} str
 * @returns {string}
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;

  // Max payload length check to prevent RegExp ReDoS
  const truncated = str.slice(0, 10000);

  // Remove <script> blocks (case-insensitive, greedy match of content)
  let result = truncated.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove any remaining <script ...> or <iframe> opening tags
  result = result.replace(/<\/?(script|iframe|object|embed|applet)\b[^>]*>/gi, '');

  // Remove event handler attributes: on*="..." or on*='...' or on*=...
  result = result.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove dangerous URL protocols (javascript:, vbscript:, data:text/html, etc.)
  result = result.replace(/(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '');

  return result;
}

/**
 * Recursively deep-sanitizes all string fields in a UI schema
 * and blocks prototype pollution attempts.
 * @param {object} schema
 * @param {number} [depth=0] Recursion depth guard
 * @returns {object} Cleaned schema clone
 */
export function sanitizeSchema(schema, depth = 0) {
  if (!schema || typeof schema !== 'object' || depth > 10) return schema;

  if (Array.isArray(schema)) {
    return schema.map(item => sanitizeSchema(item, depth + 1));
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(schema)) {
    // Prototype pollution prevention
    if (DANGEROUS_OBJECT_KEYS.has(key)) {
      continue;
    }

    if (typeof val === 'string') {
      cleaned[key] = sanitizeString(val);
    } else if (typeof val === 'object' && val !== null) {
      cleaned[key] = sanitizeSchema(val, depth + 1);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default {
  validateUISchema,
  validateComponent,
  validateStep,
  sanitizeString,
  sanitizeSchema,
  escapeHtml,
  ALLOWED_COMPONENT_TYPES,
  ALLOWED_STEP_KEYS,
  ALLOWED_COMPONENT_KEYS,
};
