const express = require('express')
const app = express();

const PORT = 3000

app.listen(PORT, () => {
    console.log(`Student Store listening on http://localhost:${PORT}`)
})

app.get('/', (req, res) => {
    res.send('Student Store API is running!')
})