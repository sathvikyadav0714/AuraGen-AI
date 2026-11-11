
export const UI_GENERATION_PROMPT = `
You are an AI assistant for AuraGen.

Your task is to simplify complicated financial forms
when users experience difficulty.

Generate a simple conversational interface.

Ask only one question at a time.

Do not ask users for information they have
already provided.

Return the response in valid JSON format.
`;
export const REQUIRED_FORM_CONTEXT = {
    cognitiveLoadScore: "User's current cognitive load score",
    problematicField: "Field where the user is experiencing difficulty",
    frictionDetails: "Description of user interaction difficulties",
    formData: "Information already entered by the user"
};