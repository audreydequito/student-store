const prisma = require('../src/db/db')

class OrderItem {
  // Lists order items, optionally filtered by orderId and/or productId.
  // Includes the related order and product for convenience.
  static async listOrderItems({ orderId, productId } = {}) {
    const where = {}
    if (orderId !== undefined) where.orderId = orderId
    if (productId !== undefined) where.productId = productId

    return prisma.orderItem.findMany({
      where,
      include: { order: true, product: true },
    })
  }

  // Returns a single order item (with its order and product), or null if not found.
  static async getOrderItemById(id) {
    return prisma.orderItem.findUnique({
      where: { id },
      include: { order: true, product: true },
    })
  }

  // Creates a single order item. `price` should be the product's price at
  // time of purchase (the caller supplies it; orders normally create items
  // via the transactional Order.createOrder flow instead).
  static async createOrderItem({ orderId, productId, quantity, price }) {
    return prisma.orderItem.create({
      data: { orderId, productId, quantity, price },
    })
  }

  // Adds an item to an existing order, atomically. Like Order.createOrder, the
  // price is taken from the DB product (never trusted from the client) and the
  // order's totalPrice is bumped to stay consistent. Throws an Error tagged with
  // a `code` if the order or product does not exist.
  static async addItemToOrder({ orderId, productId, quantity }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (!order) {
        const err = new Error(`Order ${orderId} does not exist`)
        err.code = 'ORDER_NOT_FOUND'
        throw err
      }

      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) {
        const err = new Error(`Product ${productId} does not exist`)
        err.code = 'PRODUCT_NOT_FOUND'
        throw err
      }

      // Bump the order total so the included order reflects the new units.
      await tx.order.update({
        where: { id: orderId },
        data: { totalPrice: order.totalPrice + product.price * quantity },
      })

      // If this product is already a line item on the order, merge into it
      // (increment quantity) instead of creating a duplicate row.
      const existing = await tx.orderItem.findFirst({
        where: { orderId, productId },
      })

      if (existing) {
        return tx.orderItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
          include: { order: true, product: true },
        })
      }

      return tx.orderItem.create({
        data: { orderId, productId, quantity, price: product.price },
        include: { order: true, product: true },
      })
    })
  }
}

module.exports = OrderItem
