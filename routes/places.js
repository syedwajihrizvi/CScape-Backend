const config = require('config')
const express = require('express')
const axios = require('axios')
const authorization = require('../middleware/auth')
const apiKey = config.get('googleApiKey')
const apiUrl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
const router = express.Router()

if (!apiKey) {
    throw new Error("Required Google Maps Api Key was not provided")
}

router.post('', authorization, async (req, res) => {
    const { places } = req.body
    const placeDetailsPromises = places.map(place => {
        const params = {
            place_id: place.placeId,
            key: apiKey
        }
        const url = `https://maps.googleapis.com/maps/api/place/details/json`
        return axios.get(url, {params}).then(response => {
            return {category: place.category, result: response.data}
        })
    })

    try {
        const results = await Promise.all(placeDetailsPromises)
        // Parse the data and only send relative information to the client
        const parsedResults = results.map(receivedResult => {
            const {result:place_details, category} = receivedResult
            return {
                    place_id: place_details.result.place_id,
                    rating: place_details.result.rating,
                    name: place_details.result.name,
                    openings: place_details.result.current_opening_hours && place_details.result.current_opening_hours.weekday_text,
                    address: place_details.result.formatted_address,
                    phone_number: place_details.result.formatted_phone_number,
                    photos: place_details.result.photos,
                    reviews: place_details.result.reviews,
                    website: place_details.result.website,
                    geometry: place_details.result.geometry,
                    category: category
                }
        })
        return res.send(parsedResults)
    } catch (error) {
        return res.status(501).send("An internal server error occured")
    }
})

router.post('/nearby', async (req, res) => {
    // Collect the location of the city
    // Collect the types of places we are looking for
    const {location, type:categories} = req.body
    const nearbyPlacesPromise = categories.map(category => {
        const params = {
            location,
            radius: "50000",
            type: category,
            key: apiKey
        }
        return axios.get(apiUrl, {params}).then(response => {
            return {category, places: response.data.results}
        })    
    })
    
    try {
        const results = await Promise.all(nearbyPlacesPromise)
        return res.send(results)
    } catch (error) {
        console.log("Error occured")
        return res.status(501).send("An internal server error occured")
    }
})

router.post('/place-details', async (req, res) => {
    const { place_id } = req.body
    const params = {
        place_id,
        key: apiKey
    }
    const result = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {params})
    // Parse the result
    const {data: {result: place_details}} = result
    res.send({
        name: place_details.name,
        openings: place_details.current_opening_hours && place_details.current_opening_hours.weekday_text,
        address: place_details.formatted_address,
        phone_number: place_details.formatted_phone_number,
        photos: place_details.photos,
        reviews: place_details.reviews,
        website: place_details.website
    })
})


router.post('/photos', async (req, res) => {
    const { photo_reference, maxwidth } = req.body
    const params = { photo_reference, maxwidth , key: apiKey}
    const response = await axios.get("https://maps.googleapis.com/maps/api/place/photo", {params, responseType: 'stream'})
    res.setHeader('Content-Type', response.headers['content-type']);
    // Stream the image data directly to the client
    response.data.pipe(res);
})

module.exports = router