import Joi from "joi";

const categoryValidationSchema = Joi.object({

    name: Joi.string()
        .min(3)
        .pattern(/^[A-Z][A-Za-z\s]*$/)  // First letter uppercase, rest uppercase letters, lowercase letters, or spaces
        .max(30)
        .required()
        .messages({
            'string.pattern.base': 'Category name should start with an uppercase letter !!!',
            'string.min': 'Category name should have at least {#limit} characters and start with an uppercase leter.',
            'string.max': 'Category name should not exceed {#limit} characters.',
            'any.required': 'Category name is required.',
        }),




})

export { categoryValidationSchema }