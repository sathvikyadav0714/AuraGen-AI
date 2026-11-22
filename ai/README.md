
# AuraGen AI Module

## Overview

The AuraGen AI module generates simplified conversational user interfaces based on user interaction difficulties and cognitive load information.

It uses a Large Language Model (LLM) through the Groq API to generate structured UI JSON.

The generated response is validated before being returned to the backend.

## Architecture

Form Context
     |
     v
Input Validation
     |
     v
Prompt Templates
     |
     v
Groq API
     |
     v
AI-generated UI JSON
     |
     v
Response Validator
     |
     v
Validated UI JSON
     |
     v
Backend Integration

## Technologies Used

- JavaScript (Node.js)
- Groq API
- Groq SDK
- dotenv
- JSON

## Project Structure

ai/
|
|-- contextExample.js
|-- designSystem.js
|-- llmService.js
|-- promptTemplates.js
|-- responseValidator.js
|-- testGroq.js
|-- testGroqValidation.js
|-- testAIValidation.js
|-- testValidator.js
|-- testWorkflow.js
|-- package.json
|-- package-lock.json
|-- .env.example
|-- .gitignore
|-- README.md

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/sathvikyadav0714/AuraGen-AI.git
```

### 2. Navigate to the AI folder

```bash
cd AuraGen-AI/ai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the ai folder.

Add:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Obtain an API key from the Groq developer console.

Never upload your actual `.env` file to GitHub.

### 5. Run AI generation test

```bash
node testGroq.js
```

This test sends sample form context to the Groq API and checks the generated UI response.

### 6. Run validation tests

```bash
node testGroqValidation.js
```

## Input Context

The AI service accepts the following information:

- cognitiveLoadScore: Current cognitive load score (0-100).
- problematicField: Field where the user experiences difficulty.
- frictionDetails: Description of interaction difficulties.
- formData: Information already entered by the user.

## AI Response Structure

The AI service returns a consistent response.

Successful response:

```json
{
  "success": true,
  "message": "UI generated and validated successfully.",
  "data": {
    "title": "Simplified Financial Form",
    "steps": [
      {
        "question": "What is your annual income?",
        "component": "NUMBER_INPUT"
      }
    ],
    "navigation": ["Next", "Back", "Submit"],
    "progress": 50
  }
}
```

Failed response:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_AI_RESPONSE",
    "message": "Validation failed."
  }
}
```

## Validation

The response validator checks:

- Valid JSON structure.
- Required fields.
- Question format.
- Allowed UI components.
- Supported navigation actions.
- Progress value between 0 and 100.

## Error Handling

The AI service handles:

- Missing API key.
- Invalid input context.
- Empty AI responses.
- Invalid AI-generated JSON.
- API errors.
- Rate limits.
- Timeout errors.
- Temporary API failures with retry attempts.

## Testing

The module includes tests for:

- Actual Groq AI generation.
- Form context validation.
- AI response validation.
- Invalid JSON.
- Unsupported UI components.
- Invalid progress values.
- Missing required context.

## Integration Status

The AI generation service currently accepts sample form context and returns validated UI JSON.

Backend and WebSocket integration with the other AuraGen modules remains a separate integration step.

## Security

- API keys are stored in `.env`.
- `.env` is excluded from Git.
- `.env.example` provides placeholder configuration.
- Only approved UI component identifiers are accepted by the response validator.
- AI-generated JavaScript is not executed.

## Note

This implementation currently uses Groq as the LLM provider. The provider choice should be confirmed with the project lead.
