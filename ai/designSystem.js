
export const ALLOWED_UI_COMPONENTS = {
    TextInput: {
        type: "text",
        description: "For names and other text information"
    },

    NumberInput: {
        type: "number",
        description: "For age, income and other numeric values"
    },

    EmailInput: {
        type: "email",
        description: "For email addresses"
    },

    PhoneInput: {
        type: "tel",
        description: "For phone numbers"
    },

    SelectInput: {
        type: "select",
        description: "For selecting one option from a list"
    },

    TextArea: {
        type: "textarea",
        description: "For longer text answers"
    },

    RadioGroup: {
        type: "radio",
        description: "For selecting one option from multiple choices"
    },

    CheckboxGroup: {
        type: "checkbox",
        description: "For selecting multiple options"
    },

    InfoBlock: {
        type: "info",
        description: "For displaying helpful information"
    },

    ProgressBar: {
        type: "progress",
        description: "Shows the user's progress through the form"
    },

    Heading: {
        type: "heading",
        description: "For section headings"
    },

    Paragraph: {
        type: "paragraph",
        description: "For displaying descriptive text"
    },

    Divider: {
        type: "divider",
        description: "For visually separating sections"
    }
};
