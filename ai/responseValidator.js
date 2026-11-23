
import { ALLOWED_UI_COMPONENTS } from "./designSystem.js";

// Allowed properties for each part of the UI schema
const ALLOWED_TOP_LEVEL_KEYS = [
    "steps",
    "metadata",
    "preservedData"
];

const ALLOWED_STEP_KEYS = [
    "id",
    "title",
    "description",
    "components",
    "validation"
];

const ALLOWED_COMPONENT_KEYS = [
    "type",
    "id",
    "label",
    "name",
    "placeholder",
    "required",
    "options",
    "rows",
    "min",
    "max",
    "validation",
    "defaultValue",
    "message",
    "value",
    "text"
];

// Helper: Check whether a value is a plain object
function isPlainObject(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

// Helper: Check for unexpected properties
function checkAllowedKeys(object, allowedKeys, sectionName) {
    const unexpectedKeys = Object.keys(object).filter(
        key => !allowedKeys.includes(key)
    );

    if (unexpectedKeys.length > 0) {
        throw new Error(
            `Unexpected ${sectionName} properties: ${unexpectedKeys.join(", ")}`
        );
    }
}

// Main AI response validator
export function validateAIResponse(response) {

    // Step 1: Check response
    if (typeof response !== "string" || response.trim() === "") {
        return {
            valid: false,
            error: "AI response must be a non-empty string."
        };
    }

    try {

        // Step 2: Parse JSON
        const parsedResponse = JSON.parse(response);

        // Step 3: Validate root object
        if (!isPlainObject(parsedResponse)) {
            throw new Error("AI response must be a JSON object.");
        }

        // Step 4: Validate top-level properties
        checkAllowedKeys(
            parsedResponse,
            ALLOWED_TOP_LEVEL_KEYS,
            "top-level"
        );

        // Step 5: Validate steps
        if (
            !Array.isArray(parsedResponse.steps) ||
            parsedResponse.steps.length === 0
        ) {
            throw new Error("Response must contain at least one UI step.");
        }

        if (parsedResponse.steps.length > 20) {
            throw new Error("Response cannot contain more than 20 steps.");
        }

        // Step 6: Validate each step
        parsedResponse.steps.forEach((step, stepIndex) => {

            if (!isPlainObject(step)) {
                throw new Error(`Step ${stepIndex + 1} must be an object.`);
            }

            checkAllowedKeys(
                step,
                ALLOWED_STEP_KEYS,
                `step ${stepIndex + 1}`
            );

            if (
                typeof step.id !== "string" ||
                step.id.trim() === ""
            ) {
                throw new Error(
                    `Step ${stepIndex + 1} must have a valid id.`
                );
            }

            if (
                step.title !== undefined &&
                typeof step.title !== "string"
            ) {
                throw new Error(
                    `Step ${stepIndex + 1} title must be a string.`
                );
            }

            if (
                step.description !== undefined &&
                typeof step.description !== "string"
            ) {
                throw new Error(
                    `Step ${stepIndex + 1} description must be a string.`
                );
            }

            if (
                !Array.isArray(step.components) ||
                step.components.length === 0
            ) {
                throw new Error(
                    `Step ${stepIndex + 1} must contain at least one component.`
                );
            }

            // Step 7: Validate components inside each step
            step.components.forEach((component, componentIndex) => {

                const location =
                    `Step ${stepIndex + 1}, component ${componentIndex + 1}`;

                if (!isPlainObject(component)) {
                    throw new Error(`${location} must be an object.`);
                }

                checkAllowedKeys(
                    component,
                    ALLOWED_COMPONENT_KEYS,
                    location
                );

                // Validate component type
                if (
                    typeof component.type !== "string" ||
                    !Object.prototype.hasOwnProperty.call(
                        ALLOWED_UI_COMPONENTS,
                        component.type
                    )
                ) {
                    throw new Error(
                        `${location} has an unsupported component type: ${component.type}`
                    );
                }

                // Validate component ID
                if (
                    typeof component.id !== "string" ||
                    component.id.trim() === ""
                ) {
                    throw new Error(
                        `${location} must have a valid id.`
                    );
                }

                // Validate field name
                if (
                    component.name !== undefined &&
                    typeof component.name !== "string"
                ) {
                    throw new Error(
                        `${location} name must be a string.`
                    );
                }

                // Validate label
                if (
                    component.label !== undefined &&
                    typeof component.label !== "string"
                ) {
                    throw new Error(
                        `${location} label must be a string.`
                    );
                }

                // Validate placeholder
                if (
                    component.placeholder !== undefined &&
                    typeof component.placeholder !== "string"
                ) {
                    throw new Error(
                        `${location} placeholder must be a string.`
                    );
                }

                // Validate required
                if (
                    component.required !== undefined &&
                    typeof component.required !== "boolean"
                ) {
                    throw new Error(
                        `${location} required must be true or false.`
                    );
                }

                // Validate options
                if (component.options !== undefined) {

                    if (!Array.isArray(component.options)) {
                        throw new Error(
                            `${location} options must be an array.`
                        );
                    }

                    component.options.forEach((option, optionIndex) => {

                        if (
                            !isPlainObject(option) ||
                            typeof option.value !== "string" ||
                            typeof option.label !== "string"
                        ) {
                            throw new Error(
                                `${location} option ${optionIndex + 1} must contain string value and label properties.`
                            );
                        }
                    });
                }

                // Validate numeric properties
                ["rows", "min", "max"].forEach(property => {

                    if (
                        component[property] !== undefined &&
                        (
                            typeof component[property] !== "number" ||
                            !Number.isFinite(component[property])
                        )
                    ) {
                        throw new Error(
                            `${location} ${property} must be a valid number.`
                        );
                    }
                });

                // Validate text properties
                ["message", "text"].forEach(property => {

                    if (
                        component[property] !== undefined &&
                        typeof component[property] !== "string"
                    ) {
                        throw new Error(
                            `${location} ${property} must be a string.`
                        );
                    }
                });

                // Validate validation configuration
                if (
                    component.validation !== undefined &&
                    !isPlainObject(component.validation)
                ) {
                    throw new Error(
                        `${location} validation must be an object.`
                    );
                }
            });
        });

        // Step 8: Validate optional metadata
        if (
            parsedResponse.metadata !== undefined &&
            !isPlainObject(parsedResponse.metadata)
        ) {
            throw new Error("Metadata must be an object.");
        }

        // Step 9: Validate optional preserved data
        if (
            parsedResponse.preservedData !== undefined &&
            !isPlainObject(parsedResponse.preservedData)
        ) {
            throw new Error("Preserved data must be an object.");
        }

        // Step 10: Return validated schema
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



