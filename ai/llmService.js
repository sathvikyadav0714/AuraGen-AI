

import { UI_GENERATION_PROMPT } from "./promptTemplates.js";

export async function generateUI(formContext) {
    console.log("Generating simplified UI...");

    console.log("Form Context:", formContext);
    console.log("Prompt:", UI_GENERATION_PROMPT);

    return {
        message: "AI service is ready for integration"
    };
}
