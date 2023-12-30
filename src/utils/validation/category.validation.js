import Joi from "joi";

const categoryValidationSchema = Joi.object({

    name: Joi.string()
        .pattern(/^[A-Z][A-Za-z\s]*$/)  // First letter uppercase, rest uppercase letters, lowercase letters, or spaces
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.pattern.base': 'Category name should start with an uppercase letter !!!',
            'string.min': 'Category name should have at least {#limit} characters.',
            'string.max': 'Category name should not exceed {#limit} characters.',
            'any.required': 'Category name is required.',
        }),



            
})

export { categoryValidationSchema }