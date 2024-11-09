const axios  = require('axios')
const express = require('express')
const config = require('config')
const router = express.Router()

const apiKey = config.get('weatherApiKey')
const apiUrl = "https://api.openweathermap.org/data/3.0/onecall"

if (!apiKey) {
    throw new Error('Required Weather API Key was not provided.')
}

router.post('', async (req, res) => {
    const { lat, lon } = req.body
    const params = {
        lat,
        lon,
        exclude: 'minutely',
        appid: apiKey
    }
    try {
        const result = await axios.get(apiUrl, { params } )
        const { current, daily } = result.data
        const queriedResult = {}
        queriedResult.current = {
            temperature: current.temp,
            weather: current.weather[0].main
        }
        for (idx in daily) {
            const key = "Day" + idx.toString()
            const data = daily[idx]
            const { day, night, eve, morn } = data.temp
            queriedResult[key] = {
                summary: data.summary,
                day, night, eve, morn,
                weather: data.weather[0].main
            }
        }
        return res.send(queriedResult)
    } catch (error) {
        return res.status(400).send("An error occured")
    }
})

module.exports = router