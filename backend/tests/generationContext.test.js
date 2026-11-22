const {
    buildGenerationContext
} = require("../generationContext");

describe("Generation Context Tests", () => {
    test("should build context from session data", () => {
        const session = {
            cognitiveLoadScore: 85,
            formData: {
                age: 21,
                income: 50000
            },
            interactionHistory: [
                {
                    eventType: "rage_click",
                    field: "annualIncome"
                },
                {
                    eventType: "validation_error",
                    field: "annualIncome"
                }
            ]
        };

        const context = buildGenerationContext(session);

        expect(context.cognitiveLoadScore).toBe(85);
        expect(context.problematicField).toBe("annualIncome");
        expect(context.frictionDetails).toContain("rage_click");
        expect(context.formData.income).toBe(50000);
    });

    test("should handle missing problematic field", () => {
        const session = {
            cognitiveLoadScore: 75,
            formData: {},
            interactionHistory: [
                { eventType: "hesitation" }
            ]
        };

        const context = buildGenerationContext(session);

        expect(context.problematicField).toBe("unknown");
        expect(context.frictionDetails).toContain("hesitation");
    });

    test("should handle empty interaction history", () => {
        const context = buildGenerationContext({
            cognitiveLoadScore: 80,
            formData: {},
            interactionHistory: []
        });

        expect(context.problematicField).toBe("unknown");
        expect(context.frictionDetails).toContain("without recorded friction");
    });

    test("should reject invalid session", () => {
        expect(() => buildGenerationContext(null)).toThrow(
            "Valid session is required"
        );
    });
});