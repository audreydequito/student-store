const express = require('express')
const OrderItemController = require('../controllers/orderItemController')

const router = express.Router()

router.get('/', OrderItemController.list)

module.exports = router
