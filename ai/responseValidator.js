
export function validateAIResponse(response) {
    if (!response || typeof response !== "string") {
        return {
            valid: false,
            error: "AI response must be a non-empty string."
        };
    }

    try {
        const parsedResponse = JSON.parse(response);

        if (
            typeof parsedResponse !== "object" ||
            parsedResponse === null ||
            Array.isArray(parsedResponse)
        ) {
            throw new Error("AI response must be a JSON object.");
        }

        const requiredFields = [
            "title",
            "steps",
            "navigation",
            "progress"
        ];

        const missingFields = requiredFields.filter(
            field => !(field in parsedResponse)
        );

        if (missingFields.length > 0) {
            return {
                valid: false,
                error: `Missing required fields: ${missingFields.join(", ")}`
            };
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
