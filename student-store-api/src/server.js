const express = require('express')
const cors = require('cors')
const Product = require('../models/product')
const Order = require('../models/order')
const OrderItem = require('../models/orderItem')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Student Store API is running!')
})

// GET /products — list all products, optionally filtered by ?category=/?name= and sorted by ?sort=
app.get('/products', async (req, res) => {
    const { category, name, sort } = req.query

    // Reject an unrecognized sort value before hitting the database.
    if (sort !== undefined && !Product.sortOptions.includes(sort)) {
        return res.status(400).json({ error: 'Invalid sort value' })
    }

    try {
        const products = await Product.listProducts({ category, name, sort })
        res.status(200).json(products)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products' })
    }
})

// GET /products/:id — get a single product by id
app.get('/products/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Product id must be a number' })
    }

    try {
        const product = await Product.getProductById(id)
        if (!product) {
            return res.status(404).json({ error: 'Product not found' })
        }
        res.status(200).json(product)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product' })
    }
})

// POST /products — create a new product
app.post('/products', async (req, res) => {
    const { name, price, description, image_url, imageUrl, category } = req.body

    if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'name is required' })
    }
    if (typeof price !== 'number' || Number.isNaN(price)) {
        return res.status(400).json({ error: 'price is required and must be a number' })
    }
    if (typeof category !== 'string' || category.trim() === '') {
        return res.status(400).json({ error: 'category is required' })
    }

    try {
        const data = { name, price, category }
        if (description !== undefined) data.description = description
        // Accept either image_url (spec/JSON) or imageUrl (Prisma field name).
        const image = imageUrl ?? image_url
        if (image !== undefined) data.imageUrl = image

        const product = await Product.createProduct(data)
        res.status(201).json(product)
    } catch (err) {
        res.status(500).json({ error: 'Failed to create product' })
    }
})

// PUT /products/:id — update an existing product (all fields optional)
app.put('/products/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Product id must be a number' })
    }

    const { name, price, description, image_url, imageUrl, category } = req.body
    const data = {}

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'name must be a non-empty string' })
        }
        data.name = name
    }
    if (price !== undefined) {
        if (typeof price !== 'number' || Number.isNaN(price)) {
            return res.status(400).json({ error: 'price must be a number' })
        }
        data.price = price
    }
    if (category !== undefined) {
        if (typeof category !== 'string' || category.trim() === '') {
            return res.status(400).json({ error: 'category must be a non-empty string' })
        }
        data.category = category
    }
    if (description !== undefined) data.description = description
    const image = imageUrl ?? image_url
    if (image !== undefined) data.imageUrl = image

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided to update' })
    }

    try {
        const product = await Product.updateProduct(id, data)
        res.status(200).json(product)
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' })
        }
        res.status(500).json({ error: 'Failed to update product' })
    }
})

// DELETE /products/:id — remove a product
app.delete('/products/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Product id must be a number' })
    }

    try {
        const product = await Product.deleteProduct(id)
        res.status(200).json(product)
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' })
        }
        res.status(500).json({ error: 'Failed to delete product' })
    }
})

// ---------- Order Items ----------

// GET /order-items — list all order items, optionally filtered by ?order_id=/?product_id=
app.get('/order-items', async (req, res) => {
    const { order_id, product_id } = req.query

    let orderId
    if (order_id !== undefined) {
        orderId = Number(order_id)
        if (Number.isNaN(orderId)) {
            return res.status(400).json({ error: 'order_id must be a number' })
        }
    }

    let productId
    if (product_id !== undefined) {
        productId = Number(product_id)
        if (Number.isNaN(productId)) {
            return res.status(400).json({ error: 'product_id must be a number' })
        }
    }

    try {
        const orderItems = await OrderItem.listOrderItems({ orderId, productId })
        res.status(200).json(orderItems)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order items' })
    }
})

// ---------- Orders ----------

// GET /orders — list all orders (with items), optional ?status=, ?customer_id=, ?email=, ?sort=
app.get('/orders', async (req, res) => {
    const { status, customer_id, email, sort } = req.query

    if (sort !== undefined && !Order.sortOptions.includes(sort)) {
        return res.status(400).json({ error: 'Invalid sort value' })
    }

    let customerId
    if (customer_id !== undefined) {
        customerId = Number(customer_id)
        if (Number.isNaN(customerId)) {
            return res.status(400).json({ error: 'customer_id must be a number' })
        }
    }

    try {
        const orders = await Order.listOrders({ status, customerId, email, sort })
        res.status(200).json(orders)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' })
    }
})

// GET /orders/:order_id — get a single order, including its order items
app.get('/orders/:order_id', async (req, res) => {
    const id = Number(req.params.order_id)
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Order id must be a number' })
    }

    try {
        const order = await Order.getOrderById(id)
        if (!order) {
            return res.status(404).json({ error: 'Order not found' })
        }
        res.status(200).json(order)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch order' })
    }
})

// POST /orders — create an order with its items (atomic; server computes total_price)
app.post('/orders', async (req, res) => {
    const { customer_id, customer_email, status, order_items } = req.body

    // Validate the request shape before touching the DB.
    if (typeof customer_id !== 'number' || Number.isNaN(customer_id)) {
        return res.status(400).json({ error: 'customer_id is required and must be a number' })
    }
    if (customer_email !== undefined && typeof customer_email !== 'string') {
        return res.status(400).json({ error: 'customer_email must be a string' })
    }
    if (typeof status !== 'string' || status.trim() === '') {
        return res.status(400).json({ error: 'status is required' })
    }
    if (!Array.isArray(order_items) || order_items.length === 0) {
        return res.status(400).json({ error: 'order_items must be a non-empty array' })
    }
    for (const item of order_items) {
        if (typeof item?.product_id !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
            return res.status(400).json({ error: 'Each order item needs a product_id and a positive integer quantity' })
        }
    }

    try {
        const order = await Order.createOrder({ customerId: customer_id, customerEmail: customer_email, status, orderItems: order_items })
        res.status(201).json(order)
    } catch (err) {
        // A missing product is thrown from the transaction → bad request.
        if (err.message && err.message.includes('does not exist')) {
            return res.status(400).json({ error: err.message })
        }
        res.status(500).json({ error: 'Failed to create order' })
    }
})

// POST /orders/:order_id/items — add a new item to an existing order.
// Price is taken from the DB product and the order's total_price is updated.
app.post('/orders/:order_id/items', async (req, res) => {
    const orderId = Number(req.params.order_id)
    if (Number.isNaN(orderId)) {
        return res.status(400).json({ error: 'Order id must be a number' })
    }

    const { product_id, quantity } = req.body
    if (typeof product_id !== 'number' || Number.isNaN(product_id)) {
        return res.status(400).json({ error: 'product_id is required and must be a number' })
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'quantity is required and must be a positive integer' })
    }

    try {
        const orderItem = await OrderItem.addItemToOrder({ orderId, productId: product_id, quantity })
        res.status(201).json(orderItem)
    } catch (err) {
        if (err.code === 'ORDER_NOT_FOUND' || err.code === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({ error: err.message })
        }
        res.status(500).json({ error: 'Failed to add item to order' })
    }
})

// PUT /orders/:order_id — update status only (see planning.md decision)
app.put('/orders/:order_id', async (req, res) => {
    const id = Number(req.params.order_id)
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Order id must be a number' })
    }

    const { status } = req.body
    if (typeof status !== 'string' || status.trim() === '') {
        return res.status(400).json({ error: 'status is required and must be a non-empty string' })
    }

    try {
        const order = await Order.updateOrderStatus(id, status)
        res.status(200).json(order)
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Order not found' })
        }
        res.status(500).json({ error: 'Failed to update order' })
    }
})

// DELETE /orders/:order_id — remove an order (items cascade)
app.delete('/orders/:order_id', async (req, res) => {
    const id = Number(req.params.order_id)
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Order id must be a number' })
    }

    try {
        const order = await Order.deleteOrder(id)
        res.status(200).json(order)
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Order not found' })
        }
        res.status(500).json({ error: 'Failed to delete order' })
    }
})

app.listen(PORT, () => {
    console.log(`Student Store listening on http://localhost:${PORT}`)
})
