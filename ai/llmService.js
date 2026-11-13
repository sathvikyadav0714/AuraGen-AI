
import {
    UI_GENERATION_PROMPT,
    buildUserMessage
} from "./promptTemplates.js";

export async function generateUI(formContext) {
    try {
        const userMessage = buildUserMessage(formContext);

        console.log("===== AURAGEN AI SERVICE =====");

        console.log("SYSTEM PROMPT:");
        console.log(UI_GENERATION_PROMPT);

        console.log("USER MESSAGE:");
        console.log(userMessage);

        return {
            success: true,
            systemPrompt: UI_GENERATION_PROMPT,
            userMessage: userMessage
        };

    } catch (error) {
        console.error("AI generation failed:", error);
        throw error;
    }
}
