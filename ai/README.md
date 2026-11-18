# AuraGen – AI Development Module

## 1. Overview

The AI module is responsible for preparing AI instructions and generating the foundation for simplified conversational user interfaces.

It uses user interaction information, cognitive load score, friction details and existing form data to prepare a structured request for an AI model.

## 2. Module Structure

| File | Purpose |
|---|---|
| `contextExample.js` | Provides sample user and form information. |
| `designSystem.js` | Defines the allowed UI components. |
| `promptTemplates.js` | Contains AI instructions and user message templates. |
| `llmService.js` | Validates form context and prepares AI requests. |
| `responseValidator.js` | Validates the structure and data types of AI responses. |
| `testAI.js` | Tests AI prompt preparation. |
| `testValidator.js` | Tests AI response validation. |

## 3. Key Features Implemented

- Form context preparation.
- Cognitive load and friction information handling.
- AI system prompt creation.
- Dynamic user message generation.
- Predefined UI component configuration.
- Input validation and error handling.
- JSON response validation.
- Progress value validation (0–100).
- Separate test scripts for the AI service and response validator.

## 4. Allowed UI Components

The current design system defines:

- TEXT_INPUT
- NUMBER_INPUT
- DROPDOWN
- BUTTON
- PROGRESS

These components provide a predefined set of UI elements for the intended simplified interface.

## 5. Testing

Run the following commands from the project root directory:

```bash
node ai/testAI.js
node ai/testValidator.js
```

The response validator has been tested with four scenarios:

1. Valid JSON response.
2. Missing required field.
3. Invalid progress value.
4. Invalid JSON syntax.

All four test cases passed.

## 6. Current Development Status

**Implemented:**
- Initial AI module structure.
- Form context preparation.
- Prompt templates.
- AI request preparation.
- Input validation.
- Response validation.
- Initial test scripts.

**Pending:**
- Actual LLM API integration.
- Generating real structured UI responses.
- Stronger validation of nested UI components and fields.
- Integration with the backend.
- Connection with the React dynamic UI renderer.

## 7. Technology

- JavaScript
- Node.js
- JSON
- AI prompt engineering
- Large Language Models (planned integration)