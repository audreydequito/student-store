const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const fs = require('fs')
const path = require('path')

async function seed() {
  try {
    console.log('🌱 Seeding database...\n')

    // Clear existing data (in order due to relations)
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()

    // Load JSON data
    const productsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/products.json'), 'utf8')
    )

    const ordersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/orders.json'), 'utf8')
    )

    // Seed products with explicit ids so they stay stable across reseeds and
    // match the product_id values that orders.json references.
    for (const product of productsData.products) {
      await prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.image_url,
          category: product.category,
        },
      })
    }

    // Seed orders and items
    for (const order of ordersData.orders) {
      const createdOrder = await prisma.order.create({
        data: {
          id: order.order_id,
          customerId: order.customer_id,
          customerEmail: order.customer_email,
          totalPrice: order.total_price,
          status: order.status,
          createdAt: new Date(order.created_at),
          orderItems: {
            create: order.items.map((item) => ({
              productId: item.product_id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      })

      console.log(`✅ Created order #${createdOrder.id}`)
    }

    // Inserting explicit ids does not advance Postgres' autoincrement
    // sequences, so realign them to MAX(id) — otherwise the next POST would
    // try to reuse id 1 and hit a unique-constraint error.
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1))`
    )
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('orders', 'order_id'), COALESCE((SELECT MAX(order_id) FROM orders), 1))`
    )
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('order_items', 'order_item_id'), COALESCE((SELECT MAX(order_item_id) FROM order_items), 1))`
    )

    console.log('\n🎉 Seeding complete!')
  } catch (err) {
    console.error('❌ Error seeding:', err)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
