
import {
    UI_GENERATION_PROMPT,
    buildUserMessage
} from "./promptTemplates.js";

// Generate a simplified UI using the provided form context
export async function generateUI(formContext) {
    try {
        // Step 1: Validate form context
        if (
            !formContext ||
            typeof formContext !== "object" ||
            Array.isArray(formContext)
        ) {
            throw new Error(
                "Invalid form context provided to AuraGen AI service."
            );
        }

        // Step 2: Validate cognitive load score
        if (
            !Number.isFinite(formContext.cognitiveLoadScore) ||
            formContext.cognitiveLoadScore < 0 ||
            formContext.cognitiveLoadScore > 100
        ) {
            throw new Error(
                "Cognitive load score must be a number between 0 and 100."
            );
        }

        // Step 3: Validate problematic field
        if (
            typeof formContext.problematicField !== "string" ||
            formContext.problematicField.trim() === ""
        ) {
            throw new Error(
                "Problematic field must be a non-empty string."
            );
        }

        // Step 4: Validate friction details
        if (
            typeof formContext.frictionDetails !== "string" ||
            formContext.frictionDetails.trim() === ""
        ) {
            throw new Error(
                "Friction details must be a non-empty string."
            );
        }

        // Step 5: Validate existing form data
        if (
            !formContext.formData ||
            typeof formContext.formData !== "object" ||
            Array.isArray(formContext.formData)
        ) {
            throw new Error(
                "Form data is missing or invalid."
            );
        }

        // Step 6: Prepare the user message
        const userMessage = buildUserMessage(formContext);

        // Step 7: Display AI service information
        console.log("===== AURAGEN AI SERVICE =====");

        console.log("\nSYSTEM PROMPT:");
        console.log(UI_GENERATION_PROMPT);

        console.log("\nUSER MESSAGE:");
        console.log(userMessage);

        // Step 8: Return the prepared AI request
        return {
            success: true,
            systemPrompt: UI_GENERATION_PROMPT,
            userMessage: userMessage,
            formContext: formContext
        };

    } catch (error) {
        // Step 9: Handle errors
        console.error("AI generation failed:", error.message);

        return {
            success: false,
            error: error.message
        };
    }
}
