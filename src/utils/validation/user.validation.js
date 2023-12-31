import Joi from "joi";
const schema = Joi.object({

    name: Joi.string()
        .pattern(/^[A-Z][A-Za-z\s]*$/)  // First letter uppercase, rest uppercase letters, lowercase letters, or spaces
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.pattern.base': 'Name should start with an uppercase letter',
            'string.min': 'Name should have at least {#limit} characters.',
            'string.max': 'Name should not exceed {#limit} characters.',
            'any.required': 'Name is required.',
        }),



    password: Joi.string()
        .min(3)
        .max(30)
        // .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
        .required()
        .messages({
            'string.min': 'Password should have at least {#limit} characters',
            'string.max': 'Password should not exceed {#limit} characters',
            'string.pattern.base': 'Password should include at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
            'any.required': 'Password is required',
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } }) 
        .required()
        .messages({
            'string.email': 'Enter a valid email address',
            'any.required': 'Email is required',
        }),

    mobileNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            'string.base': 'Mobile number must be a string',
            'string.length': 'Mobile number must be exactly 10 digits',
            'string.pattern.base': 'Mobile number must contain only numeric digits',
            'any.required': 'Mobile number is required',
        }),

})



export default schema