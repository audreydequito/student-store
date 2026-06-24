const prisma = require('../src/db/db')

// Serializes a Prisma product (camelCase) to the API shape, exposing the
// column as snake_case `image_url` to match the spec and the frontend.
// Returns null/undefined unchanged so callers can pass through "not found".
function toApi(product) {
  if (!product) return product
  const { imageUrl, ...rest } = product
  return { ...rest, image_url: imageUrl }
}

// Maps each allowed ?sort= value to a Prisma orderBy clause.
// The set of keys here is the single source of truth for valid sort values.
const SORT_OPTIONS = {
  price: { price: 'asc' },
  price_desc: { price: 'desc' },
  name: { name: 'asc' },
  name_desc: { name: 'desc' },
  id: { id: 'asc' },
  id_desc: { id: 'desc' },
}

class Product {
  // The valid ?sort= values, exposed so the route can validate before querying.
  static get sortOptions() {
    return Object.keys(SORT_OPTIONS)
  }

  // Lists all products, optionally filtered by category/name and sorted by `sort`.
  // Assumes `sort`, if provided, is already validated against Product.sortOptions.
  static async listProducts({ category, name, sort } = {}) {
    const where = {}
    if (category) where.category = { equals: category, mode: 'insensitive' }
    if (name) where.name = { contains: name, mode: 'insensitive' }

    const query = { where }
    if (sort && SORT_OPTIONS[sort]) query.orderBy = SORT_OPTIONS[sort]

    const products = await prisma.product.findMany(query)
    return products.map(toApi)
  }

  // Returns a single product by id, or null if it does not exist.
  static async getProductById(id) {
    const product = await prisma.product.findUnique({ where: { id } })
    return toApi(product)
  }

  // Creates a new product from the given data.
  static async createProduct(data) {
    const product = await prisma.product.create({ data })
    return toApi(product)
  }

  // Updates an existing product. Throws Prisma P2025 if the id is not found.
  static async updateProduct(id, data) {
    const product = await prisma.product.update({ where: { id }, data })
    return toApi(product)
  }

  // Deletes a product. Throws Prisma P2025 if the id is not found.
  static async deleteProduct(id) {
    const product = await prisma.product.delete({ where: { id } })
    return toApi(product)
  }
}

module.exports = Product
