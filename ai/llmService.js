
import {
    UI_GENERATION_PROMPT,
    buildUserMessage
} from "./promptTemplates.js";

// Generate a simplified UI using the provided form context
export async function generateUI(formContext) {
    try {

        // Step 1: Validate form context
        if (!formContext || typeof formContext !== "object" || Array.isArray(formContext)) {
            throw new Error(
                "Invalid form context provided to AuraGen AI service."
            );
        }

        // Step 2: Validate existing form data
        if (
            !formContext.formData ||
            typeof formContext.formData !== "object" ||
            Array.isArray(formContext.formData)
        ) {
            throw new Error(
                "Form data is missing or invalid."
            );
        }

        // Step 3: Prepare the user message
        const userMessage = buildUserMessage(formContext);

        // Step 4: Display AI service information
        console.log("===== AURAGEN AI SERVICE =====");

        console.log("\nSYSTEM PROMPT:");
        console.log(UI_GENERATION_PROMPT);

        console.log("\nUSER MESSAGE:");
        console.log(userMessage);

        // Step 5: Return the prepared AI request
        return {
            success: true,
            systemPrompt: UI_GENERATION_PROMPT,
            userMessage: userMessage,
            formContext: formContext
        };

    } catch (error) {

        // Step 6: Handle errors
        console.error("AI generation failed:", error.message);

        return {
            success: false,
            error: error.message
        };
    }
}