
import { generateUI } from "./llmService.js";
import formContext from "./contextExample.js";

// Create invalid test scenarios
const testCases = [
    {
        name: "Valid form context",
        context: formContext,
        expected: true
    },
    {
        name: "Invalid cognitive load score",
        context: {
            ...formContext,
            cognitiveLoadScore: 150
        },
        expected: false
    },
    {
        name: "Missing problematic field",
        context: {
            ...formContext,
            problematicField: ""
        },
        expected: false
    },
    {
        name: "Missing friction details",
        context: {
            ...formContext,
            frictionDetails: ""
        },
        expected: false
    },
    {
        name: "Invalid form data",
        context: {
            ...formContext,
            formData: []
        },
        expected: false
    },
    {
        name: "Missing form data",
        context: {
            cognitiveLoadScore: 85,
            problematicField: "Annual Income",
            frictionDetails: "Repeated changes"
        },
        expected: false
    }
];

// Run all tests
async function runTests() {
    let passed = 0;
    let failed = 0;

    console.log("===== AURAGEN AI INPUT VALIDATION TESTS =====");

    for (const test of testCases) {
        const result = await generateUI(test.context);

        const testPassed = result.success === test.expected;

        if (testPassed) {
            passed++;
        } else {
            failed++;
        }

        console.log(`\nTest: ${test.name}`);
        console.log("Expected:", test.expected);
        console.log("Actual:", result.success);
        console.log("Status:", testPassed ? "PASSED" : "FAILED");
    }

    console.log("\n===== FINAL TEST SUMMARY =====");
    console.log("Total tests:", testCases.length);
    console.log("Passed:", passed);
    console.log("Failed:", failed);
}

runTests();
