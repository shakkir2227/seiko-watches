import Joi from "joi";
const schema = Joi.object({

    name: Joi.string()
        .pattern(/^[A-Z][A-Za-z\s]*$/)  // First letter uppercase, rest uppercase letters, lowercase letters, or spaces
        .min(3)
        .max(30)
        .trim()
        .required()
        .messages({
            'string.pattern.base': 'Name should start with an uppercase letter',
            'string.min': 'Name should have at least {#limit} characters.',
            'string.max': ' Name should not exceed {#limit} characters.',
            'any.required': 'Name is required.',
        }),
    mobileNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .trim()
        .required()
        .messages({
            'string.base': 'Mobile number must be a string',
            'string.length': 'Mobile number must be exactly 10 digits',
            'string.pattern.base': 'Mobile number must contain only numeric digits',
            'any.required': 'Mobile number is required',
        }),
    pincode: Joi.string()
        .length(6)
        .pattern(/^[0-9]+$/)
        .trim()
        .required()
        .messages({
            'string.base': 'Pincode must be a string',
            'string.length': 'Pincode must be exactly 6 digits',
            'string.pattern.base': 'Pincode must contain only numeric digits',
            'any.required': 'Pincode is required',
        }),
    houseName: Joi.string().min(3).max(50).trim().required(),
    area: Joi.string().min(3).max(50).trim().required(),
    landmark: Joi.string().min(3).max(50).trim().required(),
    town: Joi.string().min(3).max(50).trim().required(),
    state: Joi.string().min(3).max(50).trim().required(),


})

export default schema