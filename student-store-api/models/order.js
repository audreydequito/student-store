const prisma = require('../src/db/db')

// Maps each allowed ?sort= value to a Prisma orderBy clause for orders.
const SORT_OPTIONS = {
  created_at: { createdAt: 'asc' },
  created_at_desc: { createdAt: 'desc' },
  total_price: { totalPrice: 'asc' },
  total_price_desc: { totalPrice: 'desc' },
  id: { id: 'asc' },
  id_desc: { id: 'desc' },
}

class Order {
  // The valid ?sort= values, exposed so the route can validate before querying.
  static get sortOptions() {
    return Object.keys(SORT_OPTIONS)
  }

  // Lists orders (with their items), optionally filtered by status/customerId and sorted.
  // Assumes `sort`, if provided, is already validated against Order.sortOptions.
  static async listOrders({ status, customerId, email, sort } = {}) {
    const where = {}
    if (status) where.status = { equals: status, mode: 'insensitive' }
    if (customerId !== undefined) where.customerId = customerId
    if (email) where.customerEmail = { contains: email, mode: 'insensitive' }

    const query = { where, include: { orderItems: true } }
    if (sort && SORT_OPTIONS[sort]) query.orderBy = SORT_OPTIONS[sort]

    return prisma.order.findMany(query)
  }

  // Returns a single order with its items, or null if it does not exist.
  static async getOrderById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    })
  }

  // Creates an order and its line items atomically (see planning.md Section 3).
  // The server computes total_price from authoritative DB prices, never trusting
  // the client. Throws an Error if any referenced product does not exist.
  static async createOrder({ customerId, customerEmail, status, orderItems }) {
    return prisma.$transaction(async (tx) => {
      // Fetch the referenced products to get real prices and confirm they exist.
      const ids = orderItems.map((i) => i.product_id)
      const products = await tx.product.findMany({ where: { id: { in: ids } } })

      // Every requested product must exist — otherwise roll back.
      for (const item of orderItems) {
        if (!products.find((p) => p.id === item.product_id)) {
          throw new Error(`Product ${item.product_id} does not exist`)
        }
      }

      // Compute total from DB prices (not anything the client sent).
      const totalPrice = orderItems.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.product_id)
        return sum + product.price * item.quantity
      }, 0)

      // Insert the order and its items in one nested write.
      return tx.order.create({
        data: {
          customerId,
          customerEmail,
          status,
          totalPrice,
          orderItems: {
            create: orderItems.map((item) => ({
              productId: item.product_id,
              quantity: item.quantity,
              price: products.find((p) => p.id === item.product_id).price,
            })),
          },
        },
        include: { orderItems: true },
      })
    })
  }

  // Updates an order's status only (see planning.md "PUT /orders changes status only").
  // Throws Prisma P2025 if the id is not found.
  static async updateOrderStatus(id, status) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: { orderItems: true },
    })
  }

  // Deletes an order (its items cascade). Throws Prisma P2025 if the id is not found.
  static async deleteOrder(id) {
    return prisma.order.delete({ where: { id } })
  }
}

module.exports = Order
