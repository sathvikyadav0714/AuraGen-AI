
import { validateAIResponse } from "./responseValidator.js";

// Helper function to create a valid response
function createResponse(overrides = {}) {
    return JSON.stringify({
        steps: [
            {
                id: "step-1",
                title: "Annual Income",
                description: "Enter your annual income",
                components: [
                    {
                        type: "NumberInput",
                        id: "income",
                        name: "annualIncome",
                        label: "What is your annual income?",
                        required: true
                    }
                ]
            }
        ],
        metadata: {},
        preservedData: {},
        ...overrides
    });
}

// Test cases
const testCases = [
    {
        name: "Valid response",
        response: createResponse(),
        expected: true
    },
    {
        name: "Empty steps",
        response: createResponse({ steps: [] }),
        expected: false
    },
    {
        name: "Missing step ID",
        response: createResponse({
            steps: [{
                components: [{
                    type: "NumberInput",
                    id: "income"
                }]
            }]
        }),
        expected: false
    },
    {
        name: "Missing components",
        response: createResponse({
            steps: [{
                id: "step-1"
            }]
        }),
        expected: false
    },
    {
        name: "Unsupported component",
        response: createResponse({
            steps: [{
                id: "step-1",
                components: [{
                    type: "VideoPlayer",
                    id: "video-1"
                }]
            }]
        }),
        expected: false
    },
    {
        name: "Missing component ID",
        response: createResponse({
            steps: [{
                id: "step-1",
                components: [{
                    type: "NumberInput"
                }]
            }]
        }),
        expected: false
    },
    {
        name: "Invalid options",
        response: createResponse({
            steps: [{
                id: "step-1",
                components: [{
                    type: "SelectInput",
                    id: "income-type",
                    options: "Before tax"
                }]
            }]
        }),
        expected: false
    },
    {
        name: "Unexpected component property",
        response: createResponse({
            steps: [{
                id: "step-1",
                components: [{
                    type: "NumberInput",
                    id: "income",
                    javascript: "runSomething()"
                }]
            }]
        }),
        expected: false
    },
    {
        name: "Invalid metadata",
        response: createResponse({ metadata: [] }),
        expected: false
    },
    {
        name: "Invalid JSON",
        response: "{ steps: invalid }",
        expected: false
    }
];

// Run tests
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

console.log("\n===== FINAL TEST SUMMARY =====");
console.log("Total tests:", testCases.length);
console.log("Passed:", passed);
console.log("Failed:", failed);

