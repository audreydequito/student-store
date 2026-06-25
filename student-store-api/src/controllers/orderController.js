const Order = require('../../models/order')

// Basic email format check: non-empty local part, @, domain with a dot.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

class OrderController {
    // GET /orders — list all orders (with items), optional ?status=, ?customer_id=, ?email=, ?sort=
    static async list(req, res) {
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
    }

    // GET /orders/:order_id — get a single order, including its order items
    static async get(req, res) {
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
    }

    // POST /orders — create an order with its items (atomic; server computes total_price)
    static async create(req, res) {
        const { customer_id, customer_email, status, order_items } = req.body

        // Validate the request shape before touching the DB.
        if (typeof customer_id !== 'number' || Number.isNaN(customer_id)) {
            return res.status(400).json({ error: 'customer_id is required and must be a number' })
        }
        if (typeof customer_email !== 'string' || customer_email.trim() === '') {
            return res.status(400).json({ error: 'customer_email is required' })
        }
        // Normalize obvious format issues (surrounding whitespace, casing) before validating.
        const customerEmail = customer_email.trim().toLowerCase()
        if (!EMAIL_REGEX.test(customerEmail)) {
            return res.status(400).json({ error: 'customer_email must be a valid email address' })
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
            const order = await Order.createOrder({ customerId: customer_id, customerEmail, status, orderItems: order_items })
            res.status(201).json(order)
        } catch (err) {
            // A missing product is thrown from the transaction → bad request.
            if (err.message && err.message.includes('does not exist')) {
                return res.status(400).json({ error: err.message })
            }
            res.status(500).json({ error: 'Failed to create order' })
        }
    }

    // PUT /orders/:order_id — update status only (see planning.md decision)
    static async update(req, res) {
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
    }

    // DELETE /orders/:order_id — remove an order (items cascade)
    static async remove(req, res) {
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
    }
}

module.exports = OrderController
