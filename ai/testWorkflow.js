

import { generateUI } from "./llmService.js";
import formContext from "./contextExample.js";
import { validateAIResponse } from "./responseValidator.js";

// Step 1: Create a valid simulated AI response
const simulatedAIResponse = JSON.stringify({
    title: "Simplified Financial Form",
    steps: [
        {
            question: "What is your annual income?",
            component: "NUMBER_INPUT"
        },
        {
            question: "What is your age?",
            component: "NUMBER_INPUT"
        }
    ],
    navigation: ["Next", "Back", "Submit"],
    progress: 50
});

// Step 2: Create an invalid AI response
const invalidAIResponse = JSON.stringify({
    title: "Simplified Financial Form",
    steps: [
        {
            question: "What is your annual income?",
            component: "VIDEO_PLAYER"
        }
    ],
    navigation: ["Next", "Back"],
    progress: 50
});

// Step 3: Run the complete AI workflow
async function runWorkflow() {
    console.log("===== AURAGEN AI WORKFLOW =====");

    // Step 4: Validate form context and prepare AI request
    console.log("\nSTEP 1: Processing form context...");

    const aiRequest = await generateUI(formContext);

    if (!aiRequest.success) {
        console.log("AI request failed:", aiRequest.error);
        return;
    }

    console.log("Form context accepted.");
    console.log("AI prompt prepared successfully.");

    // Step 5: Validate the valid simulated AI response
    console.log("\nSTEP 2: Testing valid AI response...");

    const validationResult = validateAIResponse(simulatedAIResponse);

    if (!validationResult.valid) {
        console.log("Valid response rejected:", validationResult.error);
        return;
    }

    console.log("Valid AI response accepted!");

    // Step 6: Display validated UI data
    console.log("\nSTEP 3: Displaying validated UI data...");

    console.log(
        JSON.stringify(validationResult.data, null, 2)
    );

    // Step 7: Test invalid AI response
    console.log("\nSTEP 4: Testing invalid AI response...");

    const invalidResult = validateAIResponse(invalidAIResponse);

    if (!invalidResult.valid) {
        console.log("Invalid AI response rejected successfully!");
        console.log("Reason:", invalidResult.error);
    } else {
        console.log("ERROR: Invalid AI response was accepted!");
    }

    console.log("\n===== WORKFLOW TESTING COMPLETED =====");
}

// Step 8: Execute the workflow
runWorkflow();
