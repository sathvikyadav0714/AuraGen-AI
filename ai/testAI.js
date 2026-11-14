
import { generateUI } from "./llmService.js";
import formContext from "./contextExample.js";

async function testAI() {
    try {
        const result = await generateUI(formContext);

        console.log("\n===== TEST RESULT =====");
        console.log("Success:", result.success);

        console.log("\n===== SYSTEM PROMPT =====");
        console.log(result.systemPrompt);

        console.log("\n===== USER MESSAGE =====");
        console.log(result.userMessage);

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testAI();
