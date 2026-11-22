
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    UI_GENERATION_PROMPT,
    buildUserMessage
} from "./promptTemplates.js";

import { validateAIResponse } from "./responseValidator.js";

// ==========================================
// 1. LOAD ENVIRONMENT VARIABLES
// ==========================================

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

dotenv.config({
    path: path.join(currentDirectory, ".env")
});

// ==========================================
// 2. GROQ CONFIGURATION
// ==========================================

const MODEL_NAME =
    process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const REQUEST_TIMEOUT = 120000;
const MAX_ATTEMPTS = 3;

// ==========================================
// 3. CREATE GROQ CLIENT
// ==========================================

function createGroqClient() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error(
            "GROQ_API_KEY is missing. Check your .env file."
        );
    }

    return new Groq({
        apiKey,
        timeout: REQUEST_TIMEOUT,
        maxRetries: 0
    });
}

// ==========================================
// 4. WAIT FUNCTION
// ==========================================

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// 5. GROQ RETRY FUNCTION
// ==========================================

async function generateWithRetry(
    groq,
    request,
    maxAttempts = MAX_ATTEMPTS
) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(
                `Groq attempt ${attempt}/${maxAttempts}`
            );

            return await groq.chat.completions.create(request);

        } catch (error) {
            const errorText = error.message || "";
            const errorName = error.name || "";

            const isTemporaryError =
                error.status === 408 ||
                error.status === 409 ||
                error.status === 429 ||
                (
                    error.status >= 500 &&
                    error.status <= 599
                ) ||
                errorName.includes("Timeout") ||
                errorName.includes("Connection") ||
                errorText.toLowerCase().includes("timeout");

            if (!isTemporaryError || attempt === maxAttempts) {
                throw error;
            }

            const delay = attempt * 2000;

            console.log(
                `Temporary Groq error. Retrying in ${delay / 1000} seconds...`
            );

            await wait(delay);
        }
    }

    throw new Error(
        "Groq generation failed after all retry attempts."
    );
}

// ==========================================
// 6. MAIN AI GENERATION FUNCTION
// ==========================================

export async function generateUI(formContext) {
    try {

        // STEP 1: VALIDATE FORM CONTEXT

        if (
            !formContext ||
            typeof formContext !== "object" ||
            Array.isArray(formContext)
        ) {
            throw new Error("Invalid form context.");
        }

        // STEP 2: VALIDATE COGNITIVE LOAD SCORE

        if (
            !Number.isFinite(formContext.cognitiveLoadScore) ||
            formContext.cognitiveLoadScore < 0 ||
            formContext.cognitiveLoadScore > 100
        ) {
            throw new Error(
                "Cognitive load score must be between 0 and 100."
            );
        }

        // STEP 3: VALIDATE PROBLEMATIC FIELD

        if (
            typeof formContext.problematicField !== "string" ||
            !formContext.problematicField.trim()
        ) {
            throw new Error(
                "Problematic field must be a non-empty string."
            );
        }

        // STEP 4: VALIDATE FRICTION DETAILS

        if (
            typeof formContext.frictionDetails !== "string" ||
            !formContext.frictionDetails.trim()
        ) {
            throw new Error(
                "Friction details must be a non-empty string."
            );
        }

        // STEP 5: VALIDATE EXISTING FORM DATA

        if (
            !formContext.formData ||
            typeof formContext.formData !== "object" ||
            Array.isArray(formContext.formData)
        ) {
            throw new Error(
                "Form data is missing or invalid."
            );
        }

        // STEP 6: PREPARE USER MESSAGE

        const userMessage = buildUserMessage(formContext);

        // STEP 7: INITIALIZE GROQ

        const groq = createGroqClient();

        console.log("\n===== AURAGEN GROQ AI SERVICE =====");
        console.log("Preparing Groq request...");

        // STEP 8: GENERATE ACTUAL UI JSON USING GROQ

        const response = await generateWithRetry(groq, {
            model: MODEL_NAME,

            messages: [
                {
                    role: "system",
                    content: UI_GENERATION_PROMPT
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],

            temperature: 0.2,
            max_completion_tokens: 2048,

            response_format: {
                type: "json_object"
            }
        });

        // STEP 9: READ GROQ RESPONSE

        const aiText =
            response.choices?.[0]?.message?.content;

        if (
            typeof aiText !== "string" ||
            !aiText.trim()
        ) {
            return {
                success: false,
                error: {
                    code: "EMPTY_RESPONSE",
                    message: "Groq returned an empty response."
                }
            };
        }

        console.log("Groq response received.");

        // STEP 10: VALIDATE AI RESPONSE

        const validationResult = validateAIResponse(aiText);

        if (!validationResult.valid) {
            return {
                success: false,
                error: {
                    code: "INVALID_AI_RESPONSE",
                    message: validationResult.error
                }
            };
        }

        // STEP 11: RETURN VALIDATED UI JSON

        console.log("Groq UI generation successful.");

        return {
            success: true,
            message: "UI generated and validated successfully.",
            data: validationResult.data
        };

    } catch (error) {

        console.error(
            "Groq generation failed:",
            error.message
        );

        const errorName = error.name || "";
        const errorText = error.message || "";

        // STEP 12: HANDLE TIMEOUT ERRORS

        if (
            errorName.toLowerCase().includes("timeout") ||
            errorText.toLowerCase().includes("timeout")
        ) {
            return {
                success: false,
                error: {
                    code: "TIMEOUT",
                    message: "Groq request timed out. Please try again."
                }
            };
        }

        // STEP 13: HANDLE API ERRORS

        if (Number.isInteger(error.status)) {

            let errorCode = "GROQ_API_ERROR";
            let errorMessage = "Groq API request failed.";

            if (error.status === 401) {
                errorCode = "AUTHENTICATION_ERROR";
                errorMessage = "Invalid Groq API key.";
            } else if (error.status === 403) {
                errorCode = "PERMISSION_ERROR";
                errorMessage = "Groq API access was denied.";
            } else if (error.status === 404) {
                errorCode = "MODEL_NOT_FOUND";
                errorMessage = "The selected Groq model was not found.";
            } else if (error.status === 429) {
                errorCode = "RATE_LIMIT_ERROR";
                errorMessage = "Groq API rate limit or quota exceeded.";
            }

            return {
                success: false,
                error: {
                    code: errorCode,
                    status: error.status,
                    message: errorMessage
                }
            };
        }

        // STEP 14: HANDLE OTHER ERRORS

        return {
            success: false,
            error: {
                code: "GENERATION_FAILED",
                message: error.message ||
                    "Unable to generate UI."
            }
        };
    }
}


