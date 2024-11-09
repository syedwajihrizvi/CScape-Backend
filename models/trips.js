const mongoose = require('mongoose')
const Joi = require('joi')

const placeSchema = new mongoose.Schema({
    placeId: String,
    category: String
})

const coordinateSchema = new mongoose.Schema({
    lat: String,
    lng: String   
})

const viewPortSchema = new mongoose.Schema({
    east: String,
    north: String,
    south: String,
    west: String
})

const tripSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    places: {
        type: [placeSchema]
    },
    coordinates: {
        type: coordinateSchema
    },
    viewPort: {
        type: viewPortSchema
    },
    date_created: {
        type: Date,
        default: Date.now
    }
})

const joiSchema = Joi.object({
    user: Joi.string().length(24).hex().required(),
    slug: Joi.string().min(2).max(255).reuired(),
    name: Joi.string().min(2).max(255).required(),
    location: Joi.string().required(),
    coordinates: Joi.object().required(),
    viewPort: Joi.object().required()
})

const validateTrip = (trip) => {
    const {error} = joiSchema.validate(trip)
    if (error) {
        return false
    }
    return true
}

const Trip = mongoose.model('Trip', tripSchema)

module.exports.Trip = Trip
module.exports.validateTrip = validateTrip