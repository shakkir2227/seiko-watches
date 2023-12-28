import Joi from "joi";

const categoryValidationSchema = Joi.object({

    name: Joi.string()
        .pattern(/^[a-zA-Z\s]+$/)  // Allow alphabets and spaces
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.pattern.base': 'Category Name should contain only alphabets ',
            'string.min': 'Category Name should have at least {#limit} characters',
            'string.max': 'Category Name should not exceed {#limit} characters',
            'any.required': 'Category Name is required',
        }),

            
})

export { categoryValidationSchema }