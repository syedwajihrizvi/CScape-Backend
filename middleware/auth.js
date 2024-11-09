const config = require('config')
const jwt = require('jsonwebtoken')

function authorization(req, res, next) {
    const token = req.header('x-auth-token')
    if (!token)
        return res.status(401).send("JWT Token was not detected in header")
    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'))
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).send("Invalid token received")
    }
}

module.exports = authorization