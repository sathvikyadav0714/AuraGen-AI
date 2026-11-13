

import { ALLOWED_UI_COMPONENTS } from "./designSystem.js";

export const UI_GENERATION_PROMPT = `
You are an AI assistant for AuraGen.

Your task is to simplify complicated financial forms
when users experience difficulty.

Generate a simple conversational interface.

Rules:
1. Ask only one question at a time.
2. Use simple language.
3. Do not ask for information already provided.
4. Preserve existing form data.
5. Use only the allowed UI components.
6. Return valid JSON only.
7. Never generate executable JavaScript code.

Allowed UI components:
${JSON.stringify(ALLOWED_UI_COMPONENTS, null, 2)}

Return a JSON object containing:
- title
- steps
- navigation
- progress
`;

export const REQUIRED_FORM_CONTEXT = {
    cognitiveLoadScore: "User's current cognitive load score",
    problematicField: "Field where the user is experiencing difficulty",
    frictionDetails: "Description of user interaction difficulties",
    formData: "Information already entered by the user"
};

export function buildUserMessage(formContext) {
    return `
Here is the user's current form information:

${JSON.stringify(formContext, null, 2)}

Generate a simplified conversational interface.
Preserve all existing form data.
`;
}
