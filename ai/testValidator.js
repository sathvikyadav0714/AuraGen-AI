
import { validateAIResponse } from "./responseValidator.js";

// Test 1: Valid response
const validResponse = JSON.stringify({
    title: "Simplified Financial Form",
    steps: [
        {
            question: "What is your annual income?",
            component: "NUMBER_INPUT"
        }
    ],
    navigation: ["Next", "Back"],
    progress: 50
});

// Test 2: Missing title
const missingTitle = JSON.stringify({
    steps: [],
    navigation: ["Next", "Back"],
    progress: 50
});

// Test 3: Invalid progress
const invalidProgress = JSON.stringify({
    title: "Financial Form",
    steps: [],
    navigation: ["Next", "Back"],
    progress: 150
});

// Test 4: Invalid JSON
const invalidJSON = "{ title: Financial Form }";

// Test 5: Missing question
const missingQuestion = JSON.stringify({
    title: "Financial Form",
    steps: [
        {
            component: "NUMBER_INPUT"
        }
    ],
    navigation: ["Next", "Back"],
    progress: 50
});

// Test 6: Unsupported component
const unsupportedComponent = JSON.stringify({
    title: "Financial Form",
    steps: [
        {
            question: "What is your annual income?",
            component: "VIDEO_PLAYER"
        }
    ],
    navigation: ["Next", "Back"],
    progress: 50
});

// Test 7: Empty question
const emptyQuestion = JSON.stringify({
    title: "Financial Form",
    steps: [
        {
            question: "   ",
            component: "NUMBER_INPUT"
        }
    ],
    navigation: ["Next", "Back"],
    progress: 50
});

// Test 8: Invalid navigation
const invalidNavigation = JSON.stringify({
    title: "Financial Form",
    steps: [],
    navigation: ["Next", 123],
    progress: 50
});

// Define all test cases
const testCases = [
    {
        name: "Valid response",
        response: validResponse,
        expected: true
    },
    {
        name: "Missing title",
        response: missingTitle,
        expected: false
    },
    {
        name: "Invalid progress",
        response: invalidProgress,
        expected: false
    },
    {
        name: "Invalid JSON",
        response: invalidJSON,
        expected: false
    },
    {
        name: "Missing question",
        response: missingQuestion,
        expected: false
    },
    {
        name: "Unsupported component",
        response: unsupportedComponent,
        expected: false
    },
    {
        name: "Empty question",
        response: emptyQuestion,
        expected: false
    },
    {
        name: "Invalid navigation",
        response: invalidNavigation,
        expected: false
    }
];

// Execute all tests
console.log("===== AURAGEN VALIDATOR TESTS =====");

let passed = 0;
let failed = 0;

for (const test of testCases) {
    const result = validateAIResponse(test.response);

    const testPassed = result.valid === test.expected;

    if (testPassed) {
        passed++;
    } else {
        failed++;
    }

    console.log(`\nTest: ${test.name}`);
    console.log("Expected:", test.expected);
    console.log("Actual:", result.valid);
    console.log("Status:", testPassed ? "PASSED" : "FAILED");

    if (!result.valid) {
        console.log("Error:", result.error);
    }
}

// Display final summary
console.log("\n===== FINAL TEST SUMMARY =====");
console.log("Total tests:", testCases.length);
console.log("Passed:", passed);
console.log("Failed:", failed);
