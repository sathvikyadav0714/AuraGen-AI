
export function validateAIResponse(response) {
    // Check whether response is provided
    if (!response || typeof response !== "string") {
        return {
            valid: false,
            error: "AI response must be a non-empty string."
        };
    }

    try {
        // Convert JSON string into JavaScript object
        const parsedResponse = JSON.parse(response);

        // Ensure response is a JSON object
        if (
            typeof parsedResponse !== "object" ||
            parsedResponse === null ||
            Array.isArray(parsedResponse)
        ) {
            throw new Error("AI response must be a JSON object.");
        }

        // Check required fields and expected data types
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

        // Validate progress range
        if (
            parsedResponse.progress < 0 ||
            parsedResponse.progress > 100
        ) {
            throw new Error("Progress must be between 0 and 100.");
        }

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

