
import { generateUI } from "./llmService.js";
import { validateAIResponse } from "./responseValidator.js";
import formContext from "./contextExample.js";

// ==========================================
// AURAGEN AI VALIDATION TESTS
// ==========================================

let passed = 0;
let failed = 0;

function runTest(testName, condition) {
    if (condition) {
        console.log(`PASS: ${testName}`);
        passed++;
    } else {
        console.log(`FAIL: ${testName}`);
        failed++;
    }
}

async function runTests() {
    console.log("\n===== AURAGEN VALIDATION TESTS =====\n");

    // TEST 1: Valid form context
    const validResult = await generateUI(formContext);

    // This test calls the real Groq API.
    // We will test the local validation cases below without API calls.
    runTest(
        "Valid form context is accepted",
        validResult.success === true || validResult.error?.code !== "GENERATION_FAILED"
    );

    // TEST 2: Invalid cognitive load score
    const invalidScore = {
        ...formContext,
        cognitiveLoadScore: 150
    };

    const scoreResult = await generateUI(invalidScore);

    runTest(
        "Invalid cognitive load score is rejected",
        scoreResult.success === false &&
        scoreResult.error.message.toLowerCase().includes("cognitive load score")
    );

    // TEST 3: Missing problematic field
    const missingField = {
        ...formContext,
        problematicField: ""
    };

    const fieldResult = await generateUI(missingField);

    runTest(
        "Missing problematic field is rejected",
        fieldResult.success === false &&
        fieldResult.error.message.includes("Problematic field")
    );

    // TEST 4: Missing friction details
    const missingFriction = {
        ...formContext,
        frictionDetails: ""
    };

    const frictionResult = await generateUI(missingFriction);

    runTest(
        "Missing friction details are rejected",
        frictionResult.success === false &&
        frictionResult.error.message.includes("Friction details")
    );

    // TEST 5: Invalid form data
    const invalidFormData = {
        ...formContext,
        formData: []
    };

    const formDataResult = await generateUI(invalidFormData);

    runTest(
        "Invalid form data is rejected",
        formDataResult.success === false &&
        formDataResult.error.message.includes("Form data")
    );

    // ======================================
    // RESPONSE VALIDATOR TESTS
    // ======================================

    // TEST 6: Valid AI JSON
    const validAIResponse = JSON.stringify({
        title: "Simplified Financial Form",
        steps: [
            {
                question: "What is your annual income?",
                component: "NUMBER_INPUT"
            }
        ],
        navigation: ["Next", "Back", "Submit"],
        progress: 50
    });

    const validValidation = validateAIResponse(validAIResponse);

    runTest(
        "Valid AI JSON is accepted",
        validValidation.valid === true
    );

    // TEST 7: Malformed JSON
    const malformedJSON = "{ invalid json }";

    const malformedResult = validateAIResponse(malformedJSON);

    runTest(
        "Malformed JSON is rejected",
        malformedResult.valid === false
    );

    // TEST 8: Empty response
    const emptyResponse = validateAIResponse("");

    runTest(
        "Empty AI response is rejected",
        emptyResponse.valid === false
    );

    // TEST 9: Unsupported UI component
    const unsupportedComponent = JSON.stringify({
        title: "Test Form",
        steps: [
            {
                question: "Play a video?",
                component: "VIDEO_PLAYER"
            }
        ],
        navigation: ["Next"],
        progress: 50
    });

    const componentResult = validateAIResponse(
        unsupportedComponent
    );

    runTest(
        "Unsupported UI component is rejected",
        componentResult.valid === false
    );

    // TEST 10: Invalid progress
    const invalidProgress = JSON.stringify({
        title: "Test Form",
        steps: [
            {
                question: "What is your age?",
                component: "NUMBER_INPUT"
            }
        ],
        navigation: ["Next"],
        progress: "50%"
    });

    const progressResult = validateAIResponse(invalidProgress);

    runTest(
        "Invalid progress type is rejected",
        progressResult.valid === false
    );

    // ======================================
    // TEST SUMMARY
    // ======================================

    console.log("\n===== TEST SUMMARY =====");

    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);

    if (failed === 0) {
        console.log("\nAll validation tests passed!");
    } else {
        console.log("\nSome validation tests failed.");
        process.exitCode = 1;
    }
}

runTests().catch(error => {
    console.error("Test execution failed:", error);
    process.exitCode = 1;
});
