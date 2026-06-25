const express = require('express')
const cors = require('cors')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const orderItemRoutes = require('./routes/orderItemRoutes')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Student Store API is running!')
})

app.use('/products', productRoutes)
app.use('/orders', orderRoutes)
app.use('/order-items', orderItemRoutes)

app.listen(PORT, () => {
    console.log(`Student Store listening on http://localhost:${PORT}`)
})
