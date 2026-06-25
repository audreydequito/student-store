const express = require('express')
const OrderController = require('../controllers/orderController')
const OrderItemController = require('../controllers/orderItemController')

const router = express.Router()

router.get('/', OrderController.list)
router.get('/:order_id', OrderController.get)
router.post('/', OrderController.create)
// Add a new item to an existing order (handled by the order-item controller).
router.post('/:order_id/items', OrderItemController.addToOrder)
router.put('/:order_id', OrderController.update)
router.delete('/:order_id', OrderController.remove)

module.exports = router
