const Joi = require('joi');
const User = require('../models/user');

class UserValidator {
    static async validate(user, isUpdate = false) {
        let userSchema;
        if (isUpdate) {
            userSchema = Joi.object({
                firstName: Joi.string().min(3),
                lastName: Joi.string().min(3),
                email: Joi.string().email(),
                password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/),
                age: Joi.number().min(18),
                job: Joi.string().min(3)
            }).or('firstName', 'lastName', 'email', 'password', 'age', 'job').required();
        } else {
            userSchema = Joi.object({
                firstName: Joi.string().required().min(3),
                lastName: Joi.string().required().min(3),
                email: Joi.string().email().required(),
                password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/).required(),
                age: Joi.number().required().min(18),
                job: Joi.string().required().min(3)
            });
        }

        try {
            await userSchema.validateAsync(user);
            if (!isUpdate) {
                // Check if email is unique
                const existingUser = await User.findOne({ email: user.email });
                if (existingUser) {
                    throw new Error('Email already exists');
                }
            }
        } catch (error) {
            throw new Error(error.message);
        }
    }
}

module.exports = UserValidator;
