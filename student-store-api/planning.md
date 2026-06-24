# Student Store API — Planning

## Data Models

### Product Model


| Name        | Prisma Data Type                  | Required? | Default Value                                                                                                                                                |
| ----------- | --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id          | Int @id @default(autoincrement()) | Required  |                                                                                                                                                              |
| name        | String                            | Required  |                                                                                                                                                              |
| description | String?                           | Optional  |                                                                                                                                                              |
| price       | Float                             | Required  |                                                                                                                                                              |
| image_url   | String?                           | Optional  | "[https://epay.gatech.edu/C20793_ustores/web/images/product-default-image.png](https://epay.gatech.edu/C20793_ustores/web/images/product-default-image.png)" |
| category    | String                            | Required  | "NA"                                                                                                                                                         |
| order_items | OrderItem[]                       | Required  |                                                                                                                                                              |


- **Primary Key & Auto Increment?** Primary key is `id` and it autoincrements.
- **Relationships (Foreign Keys):** No foreign keys. `Product` is the parent of `OrderItem`.
- **Cascade Behavior (parent deleted?):** `Product` is the parent of `Order` and `OrderItem`, so nothing happens to it specifically.

### Order Model


| Name           | Prisma Data Type                  | Required? | Default Value |
| -------------- | --------------------------------- | --------- | ------------- |
| order_id       | Int @id @default(autoincrement()) | Required  |               |
| customer_id    | Int                               | Required  |               |
| customer_email | String?                           | Optional  |               |
| total_price    | Float                             | Required  |               |
| status         | String                            | Required  |               |
| created_at     | DateTime @default(now())          | Required  | now()         |
| order_items    | OrderItem[]                       | Required  |               |


- **Primary Key & Auto Increment?** Primary key is `order_id` and it autoincrements.
- **Foreign Keys:** No foreign keys.
- **Cascade Behavior (parent deleted?):** `Order` is the parent of `OrderItem`, so nothing happens to it specifically.

### OrderItem Model


| Name          | Prisma Data Type                                                               | Required? | Default Value |
| ------------- | ------------------------------------------------------------------------------ | --------- | ------------- |
| order_item_id | Int @id @default(autoincrement())                                              | Required  |               |
| order_id      | Int                                                                            | Required  |               |
| order         | Order @relation(fields: [order_id], references: [order_id], onDelete: Cascade) | Required  |               |
| product_id    | Int                                                                            | Required  |               |
| product       | Product @relation(fields: [product_id], references: [id], onDelete: Cascade)   | Required  |               |
| quantity      | Int                                                                            | Required  |               |
| price         | Float                                                                          | Required  |               |


- **Primary Key & Auto Increment?** Primary key is `order_item_id` and it autoincrements.
- **Foreign Keys:**
  - `order_id` references `order_id` in the Order model.
  - `product_id` references `id` in the Product model.
- **Cascade Behavior (parent deleted?):**
  - Deleting an `Order` should also delete any `OrderItem` records referencing it.
  - Deleting a `Product` should also delete any `OrderItem` records referencing it.

## API Contract

Error response shape for the entire API: `{ "error": "message" }`


| Method | Route             | Purpose                                                       | Query Param                           | Success     | Error                          |
| ------ | ----------------- | ------------------------------------------------------------- | ------------------------------------- | ----------- | ------------------------------ |
| GET    | /products         | Lists all the products                                        | ?category=, name=, sort=              | 200 OK      |                                |
| GET    | /products/:id     | Gets a single product by id                                   |                                       | 200 OK      | 404 Not Found                  |
| POST   | /products         | Add a new product to the database                             |                                       | 201 Created | 400 Bad Request                |
| PUT    | /products/:id     | Update the details of an existing product                     |                                       | 200 OK      | 400 Bad Request, 404 Not Found |
| DELETE | /products/:id     | Remove a product from the database                            |                                       | 200 OK      | 404 Not Found                  |
| GET    | /orders           | Lists all the orders                                          | ?status=, customer_id=, email=, sort= | 200 OK      |                                |
| GET    | /orders/:order_id | Gets a single order by id, including its order items          |                                       | 200 OK      | 404 Not Found                  |
| POST   | /orders           | Create a new order with specified order items                 |                                       | 201 Created | 400 Bad Request                |
| PUT    | /orders/:order_id | Update the details of an existing order (e.g., change status) |                                       | 200 OK      | 400 Bad Request, 404 Not Found |
| DELETE | /orders/:order_id | Remove an order from the database                             |                                       | 200 OK      | 404 Not Found                  |


### GET /products — Query Parameters

`GET /products` accepts optional query parameters for filtering and sorting. They can be combined freely; filters are applied first, then ordering.


| Param      | Example            | Behavior                                                                                       |
| ---------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| `category` | `?category=Snacks` | Exact, case-insensitive match on `category`. Only products in that category are returned.      |
| `name`     | `?name=college`    | Case-insensitive substring match on `name` (search-box style).                                 |
| `sort`     | `?sort=price`      | Sort the results. Allowed values: `price`, `price_desc`, `name`, `name_desc`, `id`, `id_desc`. |


`**sort` values:**


| Value        | Order                       |
| ------------ | --------------------------- |
| `price`      | price ascending (low→high)  |
| `price_desc` | price descending (high→low) |
| `name`       | name A→Z                    |
| `name_desc`  | name Z→A                    |
| `id`         | id ascending                |
| `id_desc`    | id descending               |


**Defaults & edge cases:**

- **No parameters** → return all products, unordered (whatever order the database returns).
- **Filters combine** → `?category=Snacks&sort=price` returns only Snacks, sorted by price ascending.
- **Unknown category** (e.g. `?category=Furniture`) → valid request, returns `200 OK` with an empty array `[]` (not a 404 — filtering to zero matches is a normal, successful result).
- **Invalid `sort` value** (e.g. `?sort=color`) → `400 Bad Request` with `{ "error": "Invalid sort value" }`, since the client asked for an ordering the API can't provide.

### GET /orders — Query Parameters

`GET /orders` returns all orders, each with its `order_items` included. Optional params:


| Param         | Example                  | Behavior                                                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `status`      | `?status=pending`        | Exact, case-insensitive match on `status`.                                                                                       |
| `customer_id` | `?customer_id=101`       | Returns only orders for that customer. Must be a number → otherwise `400 Bad Request`.                                           |
| `email`       | `?email=jo`              | Case-insensitive substring match on `customer_email` (search-box style for the Past Orders page filter).                         |
| `sort`        | `?sort=total_price_desc` | Allowed: `created_at`, `created_at_desc`, `total_price`, `total_price_desc`, `id`, `id_desc`. Invalid value → `400 Bad Request`. |


**Defaults:** no parameters → all orders, unordered. Filters combine freely.

`customer_email` is an optional field captured at checkout (the email entered on the order form). It is stored on the `Order` so the Past Orders page can filter by it; older orders created before this field existed have a `null` email and simply won't match any `?email=` filter.

### What the request body looks like

**POST /orders** — client sends only `product_id` and `quantity` per item; the server fills in the price. `customer_email` is optional (captured from the checkout form, used by the Past Orders filter):

```json
{
  "customer_id": 1,
  "customer_email": "student@example.com",
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

**PUT /orders/:order_id** 

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

The client sends `order_items` as a list of `{ product_id, quantity }` only. The server does **not** trust a client-supplied price — it looks up each product's real `price` from the `Product` table and computes `total_price` itself.

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

## Decisions Log — Product Model

- **Schema translation that went smoothly**: `price` as `Float` — Prisma's `Float` maps cleanly to PostgreSQL `double precision` for currency, and the `category` default `"NA"` / `image_url` default URL translated directly to `@default(...)`.
- **Field decision I made during implementation that wasn't in the original spec**: Kept camelCase field names in code (`imageUrl`, `customerId`, `totalPrice`, `orderItems`) with `@map("snake_case")` so the database columns still match the spec's snake_case names. This is idiomatic Prisma and keeps the existing `seed.js` style consistent — the column names in the DB are unchanged from the spec.
- **Route behavior that needed a spec update**: The `?name=` query param on `GET /products` is implemented as a case-insensitive substring match (`contains`, `mode: 'insensitive'`) rather than an exact match — more useful for a search box. Confirmed `PUT /products/:id` returns `200` with the updated product and `404` when the id doesn't exist (Prisma `P2025`); no spec change needed.

## Spec Reconciliation — Milestone 4 (Schema Audit)

### Schema vs. spec gaps found

- **No field gaps found** — `OrderItem` in `schema.prisma` matches the Data Models spec exactly: `order_item_id` (PK, autoincrement) → `id @map("order_item_id")`, `order_id`, `product_id`, `quantity` (Int), `price` (Float). No extra fields, no missing fields.
- **Relationships modeled correctly** — `OrderItem.order @relation(... references: [id])` → `Order`, and `OrderItem.product @relation(... references: [id])` → `Product`, with back-relations `orderItems OrderItem[]` on both parents.
- **Cascade rules match the spec** — verified at the database level: both foreign keys report `ON DELETE CASCADE` (`order_items_order_id_fkey`, `order_items_product_id_fkey`).
- **Naming note**: schema uses camelCase fields with `@map("snake_case")`, so the DB columns still carry the spec's snake_case names (`order_id`, `product_id`, etc.). Not a gap — a deliberate convention from Milestone 1.
- **Note on `OrderItem.price`**: it stores the price *at time of purchase* (snapshot), set when the order is created from the product's then-current price — so later product price changes don't alter historical orders. Type (`Float`) was already correct.
- All three tables were created together by the Milestone 1 `init_products_table` migration (the `Product.orderItems` relation could not compile without `Order`/`OrderItem`), so no new migration was needed for this milestone — the audit confirmed the existing schema already satisfies the spec.

### Cascade delete verification

- Deleting a Product removes associated OrderItems: ✅ tested (`DELETE /products/2` → its order_items dropped from 1 to 0)
- Deleting an Order removes associated OrderItems: ✅ tested (`DELETE /orders/3` → its order_items dropped to 0)

## Decisions Log — Order Creation Transaction

- **What my Transactional Flow spec got right**: The step-by-step order of operations was accurate and translated almost line-for-line into `Order.createOrder` (`models/order.js`): fetch the referenced products inside the transaction → confirm every `product_id` exists → compute `total_price` from the DB prices → create the `Order` with its `OrderItem` rows in one nested `create` and `include: { orderItems: true }`. The decision to never trust a client-supplied price (look up the real price from the `Product` table) was right and is exactly what the code does. Verified: order of `{p3 x2, p7 x3}` returned `total_price = 22.95` (6.99·2 + 2.99·3), computed server-side.
- **What the spec missed that I discovered during implementation**: A few request-shape edge cases the spec only implied. I added explicit `400` validation for them in the route (`src/server.js`) before the transaction runs: `customer_id` must be a number, `status` must be a non-empty string, `order_items` must be a non-empty array, and each item must have a numeric `product_id` and a **positive integer** `quantity`. The original spec said "validate the request shape" but didn't enumerate the empty-array or non-integer-quantity cases — those are now enforced and worth folding back into the spec's step 1.
- **How the transaction error handling works**: `prisma.$transaction(async (tx) => { ... })` runs the callback against a single database transaction (`BEGIN`). Every write uses `tx`, so they're all part of that one transaction. If the callback returns normally, Prisma issues `COMMIT` and all writes persist together. If the callback **throws** anywhere — e.g. my explicit `throw new Error("Product 999 does not exist")` when a product is missing — Prisma issues `ROLLBACK`, undoing every write made inside that transaction. That's why a bad `product_id` leaves the database completely untouched: even though the `Order` row and the first valid `OrderItem` may have been written within the transaction, the rollback erases them. Tested: a mixed valid/invalid order returned `400` and the row counts were unchanged (no orphaned order, no partial items). The `OrderItem.product_id` foreign-key constraint is a second line of defense — even without the explicit existence check, the insert would fail and trigger the same rollback.
- **One thing I'd design differently if starting over**: I'd distinguish error causes with a typed/coded error instead of matching on the message string (`err.message.includes('does not exist')`) to decide between `400` and `500`. A small custom error class (e.g. `OrderValidationError` carrying a status code) would make the route's error handling more robust and less brittle than string matching. I'd also consider returning *all* missing product ids at once rather than throwing on the first one, so the client can fix the whole request in a single round-trip.

## Implementation Note — CORS

The original API Contract didn't mention cross-origin access, but the frontend (Vite dev server on `http://localhost:5173`) and the API (`http://localhost:3000`) are different origins, so the browser enforces CORS. The `cors` middleware is installed and enabled with `app.use(cors())` in `src/server.js` (allows all origins — fine for local dev). Verified: a request with `Origin: http://localhost:5173` returns `Access-Control-Allow-Origin:` *.

## Final Spec Reconciliation: Project Complete

### Full-system audit result

- **All 10 endpoints match the API contract** (5 product + 5 order routes), with the documented status codes, query params, and error shape (`{ "error": "message" }`). Verified end-to-end with both servers running.
- **One complete user flow (placing an order) works as specified**: the frontend GETs `/products`, the user adds items to the cart, and checkout POSTs `/orders` with `{ customer_id, status, order_items: [{ product_id, quantity }] }`. The server computes `total_price` from DB prices and returns `201` with the order and its `orderItems` — exactly the Transactional Flow contract. Tested: cart of product 1×2 + product 5×1 → order created with `total_price = 69.97`, persisted with `customer_id = 1`.
- **Spec-defined states are handled**: empty cart (frontend guards before sending), failed order / product-not-found (backend returns `400 { error }`, which the frontend surfaces via `setError`).
- **Undocumented-but-present behavior**: CORS configuration (now documented above) and the `image_url` serialization at the API boundary (now documented below).

### Gaps resolved during frontend integration

- `**imageUrl` vs `image_url`**: the frontend reads `product.image_url` (ProductCard, ProductDetail) but Prisma's model field is `imageUrl`. Resolved on the **backend** — `models/product.js` now has a `toApi()` serializer that emits `image_url` on every product response, matching both the snake_case spec and the frontend. Input already accepted `image_url`, so products round-trip in snake_case.
- **Missing integer `customer_id*`*: `POST /orders` requires an integer `customer_id`, but the checkout form only collects free-text name/dorm and there is no customers table. Resolved by hardcoding `customer_id: 1` on checkout (name/dorm remain display-only UI fields the backend doesn't store).
- **Order receipt shape**: `CheckoutSuccess.jsx` expects `order.purchase.receipt.lines`, but the API returns `{ id, customerId, totalPrice, status, orderItems }`. Resolved on the **frontend** — `handleOnCheckout` builds the `purchase.receipt.lines` array from the real API response (order #, status, item count, total).
- **No API calls existed**: the starter UI imported axios but never called it; `handleOnCheckout` was empty and products were never fetched. Added a `useEffect` to GET `/products` on mount and implemented `handleOnCheckout` to POST `/orders` (both using an `API_BASE_URL` constant in `src/constants.js`).

### What the spec enabled during this project

Writing the contract first meant integration was a matter of *checking names against a document* rather than guessing: every mismatch (the `image_url` field, the `customer_id` type, the order response shape) was caught by comparing the frontend's expectations to the written spec **before** wiring anything, so debugging was a quick reconciliation instead of a trial-and-error hunt. The Transactional Flow section in particular let the `POST /orders` request/response line up with the frontend on the first try.

## Stretch Features

### Past Orders Page (frontend)

A `/orders` route in the UI lists all orders (newest first), showing order id, email, status, item count, and total. Clicking an order navigates to `/orders/:order_id`, a detail page that fetches the single order (via `GET /orders/:order_id`) and renders its line items. Both pages reuse the already-existing `GET /orders` and `GET /orders/:order_id` endpoints. React Router note: the static `/orders` and `/orders/:order_id` routes are declared before the catch-all `/:productId` route so they take precedence.

### Filter Orders by Email

The Past Orders page has a text input that filters orders by the email of the person who placed them. It calls `GET /orders?email=<value>` (case-insensitive substring match on `customer_email`). This required adding an optional `customer_email` field to the `Order` model:

- **Schema**: `customerEmail String? @map("customer_email")` on `Order` (migration `add_customer_email_to_orders`).
- **Capture**: `POST /orders` now accepts an optional `customer_email` string and stores it; checkout sends the email typed into the payment form.
- **Filter**: `GET /orders` accepts `?email=` and matches with Prisma `{ contains, mode: 'insensitive' }`.
- Pre-existing/seeded orders have `customer_email = null` and won't match an email filter — acceptable, since they predate the field.

