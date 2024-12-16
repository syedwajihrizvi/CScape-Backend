const config = require('config')
const authorization = require('../middleware/auth')
const axios = require('axios')
const express = require('express')
const router = express.Router()
const { Trip, validateTrip } = require('../models/trips')
const { User } = require('../models/user')

const apiKey = config.get('googleApiKey')

if (!apiKey) {
    throw new Error("Required Google Api Key not provided")
}

const compareDistances = (a, b) => {
    if (a.distance.value < b.distance.value)
        return 1
    else if (a.distance.value > b.distance.value)
        return -1
    return 0
}

router.post('', authorization, async (req, res) => {
    const userId = req.user._id
    try {
        const user = await User.findById(userId)
        if (!user)
            return res.status(401).send("Not Authorized")
    } catch (error) {
        return res.status(501).send("An internal server error occured")
    }
    const isValid = validateTrip({ user:userId, ...req.body })
    if (!isValid)
        return res.status(401).send("Bad Request for Trip")
    try {
        const trip = new Trip({ user:userId, ...req.body})
        const result = await trip.save()
        return res.send(result)
    } catch (error) {
        return res.status(501).send("An internal server error occured")
    }
})

router.put('/:id', authorization, async (req, res) => {
    const { placeInfo } = req.body
    const trip = await Trip.findById(req.params.id)
    if (!trip)
        return res.status(404).send("Invalid trip")
    const placeExists = trip.places.find((place) => place.placeId == placeInfo.placeId)
    if (placeExists) {
        return res.status(400).send("Trip already includes place")
    }
    trip.places.push(placeInfo)
    try {
        const result = await trip.save()
        return res.send(result)       
    } catch (error) {
        return res.status(502).send("An error occured")
    }
})

router.get('', authorization, async (req, res) => {
    const { _id: user_id } = req.user
    const { location } = req.query
    try {
        const result = await Trip.find({user: user_id, ...(location && {location: location})})
        return res.send(result)      
    } catch (error) {
        return res.status(501).send("Internal Server Error")
    }
})

router.get('/:id', authorization, async (req, res) => {
    try {
        const result = await Trip.findById(req.params.id)
        if (!result) {
            return res.status(404).send("Trip not found")
        }
        return res.send(result)
    } catch (error) {
        return res.status(501).send("An internal server error occured")
    }
})

router.post('/optimize/:id', authorization, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id)
        if (!trip)
            return res.status(404).send("Trip not found")
        const { places } = trip
        const placeDetailsPromises = places.map(place => {
            const params = {
                place_id: place.placeId,
                key: apiKey
            }
            const url = `https://maps.googleapis.com/maps/api/place/details/json`
            return axios.get(url, {params}).then(response => {
                return {result: response.data}
            })
        })
        const results = await Promise.all(placeDetailsPromises)
        // Parse the data and only send relative information to the client
        const placesMap = {}
        const unvisitedPlaces = []
        results.map(receivedResult => {
            const {result:place_details} = receivedResult
            placesMap[place_details.result.place_id] = {
                ...place_details.result.geometry.location, 
                placeId: place_details.result.place_id
            }
            unvisitedPlaces.push(place_details.result.place_id)
        })
        const optimizedTripPlan = []
        let currentPlace = placesMap[req.body.startingPlace.place_id]
        optimizedTripPlan.push(currentPlace.placeId)
        const index = unvisitedPlaces.indexOf(currentPlace.placeId)
        unvisitedPlaces.splice(index, 1)
        while (unvisitedPlaces.length > 0) {
            // Get all the unvisited places
            const requestDestinations = unvisitedPlaces.map((place_id) => {
                const place = placesMap[place_id]
                const {lat, lng} = place
                return `${lat},${lng}`
            })
            const params = {
                origins: `${currentPlace.lat},${currentPlace.lng}`,
                destinations: requestDestinations.join('|'),
                key: apiKey
            }
            const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', { params })
            const distances = response.data.rows[0].elements
            const smallestDistance = unvisitedPlaces.map((placeId, index) => {
                return {...distances[index], placeId}
            }).sort(compareDistances).pop()
            const indexOfSmallestDistance = unvisitedPlaces.indexOf(smallestDistance.placeId)
            unvisitedPlaces.splice(indexOfSmallestDistance, 1)
            optimizedTripPlan.push(smallestDistance.placeId)
            currentPlace = placesMap[smallestDistance.placeId]
        }
        return res.send(optimizedTripPlan)
    } catch (error) {
        console.log(error)
        return res.status(501).send("An error occured")
    }
})

router.delete('/:id', authorization, async (req, res) => {
    try {
        const result = await Trip.findByIdAndDelete(req.params.id)
        if (!result) {
            return res.status(404).send("Trip not found")
        }
        return res.send(result)
    } catch (error) {
        return res.status(501).send("An error has occured")
    }
})

router.delete('/places/:id', authorization, async (req, res) => {
    try {
        const { place_id} = req.body
        if (!place_id) {
            return res.status(400).send("Invalid request missing place id")
        }
        const trip = await Trip.findById(req.params.id)
        if (!trip) {
            return res.status(404).send('Trip not found')
        }
        trip.places = trip.places.filter(place => place.placeId != place_id)
        const result = await trip.save()
        return res.send(result)
    } catch (error) {
        return res.status(501).send('An internal server error occured')
    }
})

module.exports = router