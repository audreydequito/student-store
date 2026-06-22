# Student Store API — Planning

## Data Models

### Product Model

| Name        | Prisma Data Type                  | Required? | Default Value |
| ----------- | --------------------------------- | --------- | ------------- |
| id          | Int @id @default(autoincrement()) | Required  |               |
| name        | String                            | Required  |               |
| description | String?                            | Optional  |               |
| price       | Float                             | Required  |               |
| image_url   | String?                            | Optional  |               |
| category    | String                            | Required  |               |
| order_items | OrderItem[]                       | Required  |               |

- **Primary Key & Auto Increment?** Primary key is `id` and it autoincrements.
- **Relationships (Foreign Keys):** No foreign keys. `Product` is the parent of `OrderItem`.
- **Cascade Behavior (parent deleted?):** `Product` is the parent of `Order` and `OrderItem`, so nothing happens to it specifically.

### Order Model

| Name        | Prisma Data Type                  | Required? | Default Value |
| ----------- | --------------------------------- | --------- | ------------- |
| order_id    | Int @id @default(autoincrement()) | Required  |               |
| customer_id | Int                               | Required  |               |
| total_price | Float                             | Required  |               |
| status      | String                            | Required  |               |
| created_at  | DateTime @default(now())          | Required  | now()         |
| order_items | OrderItem[]                       | Required  |               |

- **Primary Key & Auto Increment?** Primary key is `order_id` and it autoincrements.
- **Foreign Keys:** No foreign keys.
- **Cascade Behavior (parent deleted?):** `Order` is the parent of `OrderItem`, so nothing happens to it specifically.

### OrderItem Model

| Name          | Prisma Data Type                                            | Required? | Default Value |
| ------------- | ---------------------------------------------------------- | --------- | ------------- |
| order_item_id | Int @id @default(autoincrement())                          | Required  |               |
| order_id      | Int                                                        | Required  |               |
| order         | Order @relation(fields: [order_id], references: [order_id])| Required  |               |
| product_id    | Int                                                        | Required  |               |
| product       | Product @relation(fields: [product_id], references: [id])  | Required  |               |
| quantity      | Int                                                        | Required  |               |
| price         | Float                                                      | Required  |               |

- **Primary Key & Auto Increment?** Primary key is `order_item_id` and it autoincrements.
- **Foreign Keys:**
  - `order_id` references `order_id` in the Order model.
  - `product_id` references `id` in the Product model.
- **Cascade Behavior (parent deleted?):**
  - Deleting an `Order` should also delete any `OrderItem` records referencing it.
  - Deleting a `Product` should also delete any `OrderItem` records referencing it.

## API Contract

Error response shape for the entire API: `{ "error": "message" }`

| Method | Route             | Purpose                                                       | Query Param                   | Success     | Error                          |
| ------ | ----------------- | ------------------------------------------------------------ | ----------------------------- | ----------- | ------------------------------ |
| GET    | /products         | Lists all the products                                       | ?category=, name=             | 200 OK      |                                |
| GET    | /products/:id     | Gets a single product by id                                  |                               | 200 OK      | 404 Not Found                  |
| POST   | /products         | Add a new product to the database                            |                               | 201 Created | 400 Bad Request                |
| PUT    | /products/:id     | Update the details of an existing product                    |                               | 200 OK      | 400 Bad Request, 404 Not Found |
| DELETE | /products/:id     | Remove a product from the database                           |                               | 200 OK      | 404 Not Found                  |
| GET    | /orders           | Lists all the orders                                         | ?status=, customer_id=, sort= | 200 OK      |                                |
| GET    | /orders/:order_id | Gets a single order by id, including its order items         |                               | 200 OK      | 404 Not Found                  |
| POST   | /orders           | Create a new order with specified order items                |                               | 201 Created | 400 Bad Request                |
| PUT    | /orders/:order_id | Update the details of an existing order (e.g., change status)|                               | 200 OK      | 400 Bad Request, 404 Not Found |
| DELETE | /orders/:order_id | Remove an order from the database                            |                               | 200 OK      | 404 Not Found                  |

### What the request body looks like

**POST /orders** — client sends only `product_id` and `quantity` per item; the server fills in the price:

```json
{
  "customer_id": 1,
  "status": "pending",
  "order_items": [
    { "product_id": 3, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```

**POST /products** — all required fields:

```json
{
  "name": "Product Name",
  "price": 23,
  "description": "Description of product",
  "image_url": "https://example.com/product.jpg",
  "category": "product category"
}
```

**PUT /orders/:order_id** — status only (see Section 3 decision):

```json
{
  "status": "shipped"
}
```

**PUT /products/:id** — all fields optional; `?` marks that you send only what you're changing:

```json
{
  "name?": "Name",
  "description?": "Product description",
  "price?": 65.00,
  "category?": "product category",
  "image_url?": "https://example.com/product.jpg"
}
```

## Section 3: Transactional Flow

`POST /orders` is the most architecturally significant endpoint in this project. It has to create an `Order`, create multiple `OrderItem` records linked to that order, calculate and store the total price, and do all of this **atomically** — if any single step fails, the whole operation rolls back so we never end up with a half-created order.

### What the request body looks like

```json
{
  "customer_id": 1,
  "status": "pending",
  "order_items": [
    { "product_id": 3, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```

The client sends `order_items` as a list of `{ product_id, quantity }` only. The server does **not** trust a client-supplied price — it looks up each product's real `price` from the `Product` table and computes `total_price` itself. (Otherwise anyone could buy a $200 textbook for $0.01.)

### What Prisma operations run, and in what order

All of the writes happen inside a single `prisma.$transaction(async (tx) => { ... })`. The transaction is what makes the operation atomic: if the callback throws at any point, Prisma rolls back every write made inside it, so the database is left exactly as it was before the request.

1. **Validate the request shape** (before touching the DB). Confirm `customer_id` is present, `order_items` is a non-empty array, and each item has a `product_id` and a positive integer `quantity`. If not → respond `400 Bad Request`.

2. **Fetch the referenced products** (inside the transaction) to get authoritative prices and confirm they exist:

   ```js
   const ids = order_items.map(i => i.product_id);
   const products = await tx.product.findMany({ where: { id: { in: ids } } });
   ```

3. **Check every product exists.** If `products` doesn't cover every `product_id` in the request, **throw** — this triggers the rollback (nothing has been written yet) and the route responds `400 Bad Request`.

4. **Calculate the total price** in code, using the DB prices (not anything from the request):

   ```js
   const total_price = order_items.reduce((sum, item) => {
     const product = products.find(p => p.id === item.product_id);
     return sum + product.price * item.quantity;
   }, 0);
   ```

5. **Create the `Order` and its `OrderItem` rows in one nested write.** Prisma inserts the `Order` row first, then inserts each `OrderItem` with the new `order_id` foreign key filled in automatically:

   ```js
   const order = await tx.order.create({
     data: {
       customer_id,
       status,
       total_price,
       order_items: {
         create: order_items.map(item => ({
           product_id: item.product_id,
           quantity: item.quantity,
           price: products.find(p => p.id === item.product_id).price
         }))
       }
     },
     include: { order_items: true }
   });
   ```

6. **Commit and respond.** The callback returns `order`, the transaction commits, and the route responds `201 Created` with the order and its `order_items`.

### What's the response if an item references a nonexistent product

- The missing product is caught in **step 3**, before any write happens.
- We throw → the transaction rolls back → **no `Order` and no `OrderItem` rows are created**.
- The route responds `400 Bad Request` with `{ "error": "Product <id> does not exist" }`.
- Even if that check were skipped, the foreign-key constraint on `OrderItem.product_id` would reject the insert in step 5, and the transaction would still roll back the already-created `Order`.

### Why a transaction (and not separate calls)

Without `$transaction`, the flow would be: create the order, then loop creating items. If item #2 fails, item #1 and the order are already committed — leaving an orphaned, mis-priced order in the database (the 11pm debugging session). Wrapping all the writes in one transaction makes the whole thing all-or-nothing.

### Decision: PUT /orders changes status only

`PUT /orders/:order_id` updates `status` only — it does **not** edit `order_items` or quantities. Changing line items would desync `total_price` and reopen this same transactional problem. To change what's in an order, cancel it (DELETE) and create a new one (POST).