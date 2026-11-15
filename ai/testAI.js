import { generateUI } from "./llmService.js";
import formContext from "./contextExample.js";

async function testAI() {
    try {
        console.log("===== STARTING AURAGEN AI TEST =====");

        const result = await generateUI(formContext);

        // Check whether AI service was successful
        if (!result.success) {
            console.error("\nAI SERVICE FAILED:");
            console.error(result.error);
            return;
        }

        console.log("\n===== TEST RESULT =====");
        console.log("Success:", result.success);

        console.log("\n===== SYSTEM PROMPT =====");
        console.log(result.systemPrompt);

        console.log("\n===== USER MESSAGE =====");
        console.log(result.userMessage);

        console.log("\n===== FORM CONTEXT =====");
        console.log(JSON.stringify(result.formContext, null, 2));

        console.log("\n===== TEST COMPLETED SUCCESSFULLY =====");

    } catch (error) {
        console.error("\nTEST EXECUTION FAILED:");
        console.error(error.message);
    }
}

testAI();
