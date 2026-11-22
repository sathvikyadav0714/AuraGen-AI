
import { generateUI } from "./llmService.js";
import formContext from "./contextExample.js";

async function testGroq() {
    console.log("===== AURAGEN GROQ INTEGRATION TEST =====");

    console.log("\nSending form context to Groq...");

    const result = await generateUI(formContext);

    if (result.success) {
        console.log("\nSUCCESS: Groq generated a UI!");

        console.log("\nGenerated UI JSON:");

        console.log(
            JSON.stringify(result.data, null, 2)
        );

        console.log("\nGroq integration test passed!");

    } else {
        console.log("\nFAILED: Groq could not generate the UI.");

        console.log("Error code:", result.error.code);
        console.log("Error message:", result.error.message);

        console.log("\nGroq integration test failed!");
    }
}

testGroq();

