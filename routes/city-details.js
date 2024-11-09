const config = require('config')
const express = require('express')
const router = express.Router()
const OpenAI = require('openai');

const apiKey = config.get('openApiKey')

if (!apiKey) {
    throw new Error("Required Open Api Key was not provided.")
}

const client = new OpenAI({
  apiKey
});

router.post('', async (req, res) => {
    const { city } = req.body
    if (!city)
        return res.status(400).send("Invalid Request")
    try {
        const data = await client.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: "system", content: "You are a helpful tour guide." },
                { role: "user", content:  `Describe ${city} in ~ 120 words.`}
              ]
          });
          const answer = data.choices[0].message.content    
          return res.send(answer)  
    } catch (error) {
        return res.status(501).send("An internal server error occured with ChatGPT")
    }
})

module.exports = router