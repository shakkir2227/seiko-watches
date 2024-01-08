import Joi from "joi";

const userLoginValidationSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            'string.email': 'Enter a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .min(3)
        .max(20)
        .required()
        .messages({
            'string.min': 'Invalid Password',
            'string.max': 'Invalid Password',
            'any.required': 'Password is required',
        }),
})

export default userLoginValidationSchema;