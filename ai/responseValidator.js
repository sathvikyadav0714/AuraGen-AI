
import { ALLOWED_UI_COMPONENTS } from "./designSystem.js";

export function validateAIResponse(response) {
    // Step 1: Check whether response is provided
    if (!response || typeof response !== "string") {
        return {
            valid: false,
            error: "AI response must be a non-empty string."
        };
    }

    try {
        // Step 2: Parse JSON response
        const parsedResponse = JSON.parse(response);

        // Step 3: Ensure response is a JSON object
        if (
            typeof parsedResponse !== "object" ||
            parsedResponse === null ||
            Array.isArray(parsedResponse)
        ) {
            throw new Error("AI response must be a JSON object.");
        }

        // Step 4: Validate required fields
        const requiredFields = {
            title: "string",
            steps: "array",
            navigation: "array",
            progress: "number"
        };

        for (const [field, expectedType] of Object.entries(requiredFields)) {
            if (!(field in parsedResponse)) {
                throw new Error(`Missing required field: ${field}`);
            }

            const actualType = Array.isArray(parsedResponse[field])
                ? "array"
                : typeof parsedResponse[field];

            if (actualType !== expectedType) {
                throw new Error(
                    `${field} must be of type ${expectedType}.`
                );
            }
        }

        // Step 5: Validate title
        if (parsedResponse.title.trim() === "") {
            throw new Error("Title cannot be empty.");
        }

        // Step 6: Validate individual UI steps
        for (const step of parsedResponse.steps) {
            if (
                typeof step !== "object" ||
                step === null ||
                Array.isArray(step)
            ) {
                throw new Error("Each step must be an object.");
            }

            if (
                typeof step.question !== "string" ||
                step.question.trim() === ""
            ) {
                throw new Error(
                    "Each step must have a valid question."
                );
            }

            if (
                typeof step.component !== "string" ||
                step.component.trim() === ""
            ) {
                throw new Error(
                    "Each step must have a valid component."
                );
            }

            // Check approved UI components
            if (
                !Object.prototype.hasOwnProperty.call(
                    ALLOWED_UI_COMPONENTS,
                    step.component
                )
            ) {
                throw new Error(
                    `Unsupported UI component: ${step.component}`
                );
            }
        }

        // Step 7: Validate navigation
        if (
            !parsedResponse.navigation.every(
                item => typeof item === "string" && item.trim() !== ""
            )
        ) {
            throw new Error(
                "Navigation must contain non-empty strings."
            );
        }

        // Step 8: Validate progress
        if (
            !Number.isFinite(parsedResponse.progress) ||
            parsedResponse.progress < 0 ||
            parsedResponse.progress > 100
        ) {
            throw new Error(
                "Progress must be a number between 0 and 100."
            );
        }

        // Step 9: Return successful validation
        return {
            valid: true,
            data: parsedResponse
        };

    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}
