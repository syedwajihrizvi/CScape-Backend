const mongoose = require('mongoose')
const Joi = require('joi')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

const joiSchema = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().min(2).max(255).required(),
    lastName: Joi.string().min(2).max(255).required(),
    password: Joi.string()
                 .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
                 .required()
})

const validateUser = (user) => {
    const {error} = joiSchema.validate(user)
    if (error) {
        return false
    }
    return true
}
// Joi validation
const User = mongoose.model("User", userSchema)

module.exports.User = User
module.exports.validateUser = validateUser