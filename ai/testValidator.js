import { validateAIResponse } from "./responseValidator.js";

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

const result = validateAIResponse(validResponse);

console.log("===== RESPONSE VALIDATION TEST =====");
console.log("Valid:", result.valid);
console.log("Result:", result);