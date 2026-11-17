
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

// Run all tests
const testCases = [
    { name: "Valid response", response: validResponse },
    { name: "Missing title", response: missingTitle },
    { name: "Invalid progress", response: invalidProgress },
    { name: "Invalid JSON", response: invalidJSON }
];

console.log("===== AURAGEN VALIDATOR TESTS =====");

for (const test of testCases) {
    const result = validateAIResponse(test.response);

    console.log(`\nTest: ${test.name}`);
    console.log("Valid:", result.valid);
    console.log("Result:", result);
}
