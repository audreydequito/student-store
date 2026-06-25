const Product = require('../../models/product')

class ProductController {
    // GET /products — list all products, optionally filtered by ?category=/?name= and sorted by ?sort=
    static async list(req, res) {
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
    }

    // GET /products/:id — get a single product by id
    static async get(req, res) {
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
    }

    // POST /products — create a new product
    static async create(req, res) {
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
    }

    // PUT /products/:id — update an existing product (all fields optional)
    static async update(req, res) {
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
    }

    // DELETE /products/:id — remove a product
    static async remove(req, res) {
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
    }
}

module.exports = ProductController
