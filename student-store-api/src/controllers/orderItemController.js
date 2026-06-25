const OrderItem = require('../../models/orderItem')

class OrderItemController {
    // GET /order-items — list all order items, optionally filtered by ?order_id=/?product_id=
    static async list(req, res) {
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
    }

    // POST /orders/:order_id/items — add a new item to an existing order.
    // Price is taken from the DB product and the order's total_price is updated.
    static async addToOrder(req, res) {
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
    }
}

module.exports = OrderItemController
