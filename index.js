const mongoose = require('mongoose')
const cors = require('cors')
const config = require('config')
const express = require('express')
const app = express()
const places = require("./routes/places")
const weather = require("./routes/weather")
const city_details = require('./routes/city-details')
const users = require('./routes/users')
const trips = require('./routes/trips')

mongoose.connect(config.get('db'))
        .then(() => console.log("Connected to database successfully"))
        .catch(() => console.log("Error connecting to database"))

app.use(express.json())
app.use(cors())
app.use('/cscape/api/places', places)
app.use('/cscape/api/weather', weather)
app.use('/cscape/api/city-details', city_details)
app.use('/cscape/api/users', users)
app.use('/cscape/api/trips', trips)

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})