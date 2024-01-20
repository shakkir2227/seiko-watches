import Joi from "joi"

const addProductSchema = Joi.object({
    name: Joi.string()
        .pattern(/^[A-Z][\s\S]*$/)  
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.pattern.base': 'Product name should start with an uppercase letter',
            'string.min': 'Product name should have at least {#limit} characters.',
            'string.max': 'Product name should not exceed {#limit} characters.',
            'any.required': 'Product name is required.',
        }),



    description: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.base': 'Description must be a string',
            'string.empty': 'Description is required',
            'string.min': 'Description should have at least {#limit} characters',
            'string.max': 'Description should not exceed {#limit} characters',
            'any.required': 'Description is required',
        }),

    // images: Joi.array()
    //     .items(
    //         Joi.object({
    //             url: Joi.string().required().messages({
    //                 'any.required': 'Image URL is required.',
    //                 'string.empty': 'Image URL must not be empty.',
    //             }),
    //         })
    //     )
    //     .min(3)
    //     .required()
    //     .messages({
    //         'array.min': 'At least 3 images are required.',
    //         'any.required': 'At least 3 images are required.',
    //     }),


    price: Joi.number().positive().required().messages({
        'number.base': 'Price must be a number.',
        'number.positive': 'Price must be a positive number.',
        'any.required': 'Price is required.',
    }),
    stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Stock must be a number.',
        'number.integer': 'Oops! Stock must be a whole number. You entered a decimal point.',
        'number.min': 'Stock must be at least 0.',
        'any.required': 'Stock is required.',
    }),

    bandMaterial: Joi.string()
        .valid('Leather', 'Metal', 'Titanium')
        .required()
        .messages({
            'any.required': 'The Band material field is required.',
            'any.only': 'The Band material must be one of Leather, Metal, or Titanium.',
        }),

    dialColor: Joi.string()
        .valid('Black', 'Blue', 'Brown')
        .required()
        .messages({
            'any.required': 'The Dial color field is required.',
            'any.only': 'The Dial color must be one of Black, Blue, or Brown.',
        }),

});

const updateProductSchema = Joi.object({
    description: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.base': 'Description must be a string',
            'string.empty': 'Description is required',
            'string.min': 'Description should have at least {#limit} characters',
            'string.max': 'Description should not exceed {#limit} characters',
            'any.required': 'Description is required',
        }),
    price: Joi.number().positive().required().messages({
        'number.base': 'Price must be a number.',
        'number.positive': 'Price must be a positive number.',
        'any.required': 'Price is required.',
    }),
    stock: Joi.number().integer().min(0).required().messages({
        'number.base': 'Stock must be a number.',
        'number.integer': 'Oops! Stock must be a whole number. You entered a decimal point.',
        'number.min': 'Stock must be at least 0.',
        'any.required': 'Stock is required.',
    }),
})

export {
    addProductSchema,
    updateProductSchema,
} 