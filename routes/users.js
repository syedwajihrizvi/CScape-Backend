const jwt = require('jsonwebtoken')
const config = require('config')
const _ = require('lodash')
const { validateUser, User } = require('../models/user')
const express = require('express')
const router = express.Router()

router.post('/register', async (req, res) => {
    const result = validateUser(req.body)
    if (!result)
        return res.status(400).send("Invalid user content")
    const {email, firstName, lastName, password} = req.body
    // In the case the user already exists with email
    const user_exists = await User.findOne({email})
    if (user_exists)
        return res.status(400).send("User already exists")
    const user = new User({
        email,
        firstName,
        lastName,
        password
    })
    try {
        const result = await user.save()
        return res.send(result)
    } catch (error) {
        return res.status(501).send("An interal server error occured")
    }
})

router.post('/signin', async (req, res) => {
    // Ensure the request contains the proper fields
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).send("Missing required login fields")

    // Find the user with the email
    const user = await User.findOne({email})
    if (!user)
        return res.status(401).send("Invalid email or password")
    if (user.password != password)
        return res.status(401).send("Invalid email or password")
    const token = jwt.sign(_.pick(user, ['_id', 'email', 'firstName']), config.get('jwtPrivateKey'))
    return res.send(token)
})
module.exports = router