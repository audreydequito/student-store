import { useState, useEffect, useCallback } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import Icon from "../Icon/Icon"
import { formatPrice, formatDate } from "../../utils/format"
import { statusBadgeClass } from "../../utils/status"
import { API_BASE_URL } from "../../constants"
import "./OrderDetail.css"

// Detail page for a single order. Demonstrates both newer API endpoints:
//   • GET  /order-items?order_id=:id   — loads line items WITH nested product
//   • POST /orders/:order_id/items     — adds a new item to this order
// The order header/totals come from GET /orders/:id and are re-fetched after
// an item is added so the displayed total stays in sync with the server.
function OrderDetail({ products = [] }) {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)

  // Add-item form state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  // Load the order plus its items (items come from the dedicated endpoint so
  // we get product names/images, not just product ids).
  const loadOrder = useCallback(async () => {
    setIsFetching(true)
    setError(null)
    try {
      const [orderRes, itemsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/orders/${orderId}`),
        axios.get(`${API_BASE_URL}/order-items`, { params: { order_id: orderId } }),
      ])
      setOrder(orderRes.data)
      setItems(itemsRes.data)
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to load order.")
    } finally {
      setIsFetching(false)
    }
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleAddItem = async (e) => {
    e.preventDefault()
    setAddError(null)

    if (!selectedProductId) {
      setAddError("Pick a product to add.")
      return
    }

    setIsAdding(true)
    try {
      await axios.post(`${API_BASE_URL}/orders/${orderId}/items`, {
        product_id: Number(selectedProductId),
        quantity: Number(quantity),
      })
      // Reset the form and refresh so the new item + updated total appear.
      setSelectedProductId("")
      setQuantity(1)
      await loadOrder()
    } catch (err) {
      setAddError(err.response?.data?.error ?? "Failed to add item.")
    } finally {
      setIsAdding(false)
    }
  }

  if (isFetching && !order) {
    return (
      <div className="OrderDetail">
        <div className="skeleton OrderDetail-skeleton-head" />
        <div className="skeleton OrderDetail-skeleton-block" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="OrderDetail">
        <div className="banner banner-error">{error}</div>
        <Link to="/orders" className="btn btn-ghost OrderDetail-back">
          <Icon name="arrowLeft" size={16} /> Back to orders
        </Link>
      </div>
    )
  }

  if (!order) return null

  // Resolve a display name/image for each line item. The order-items endpoint
  // nests the product (with camelCase imageUrl); fall back gracefully.
  const renderItemName = (item) => item.product?.name ?? `Product #${item.productId}`

  return (
    <div className="OrderDetail">
      <nav className="OrderDetail-breadcrumb">
        <Link to="/orders">
          <Icon name="arrowLeft" size={16} /> All orders
        </Link>
      </nav>

      <div className="OrderDetail-card">
        <div className="OrderDetail-head">
          <div>
            <h1>Order #{order.id}</h1>
            <span className="text-muted">{formatDate(order.createdAt)}</span>
          </div>
          <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
        </div>

        <div className="OrderDetail-meta">
          <div className="OrderDetail-meta-item">
            <span className="OrderDetail-meta-label">Email</span>
            <span>{order.customerEmail || "—"}</span>
          </div>
          <div className="OrderDetail-meta-item">
            <span className="OrderDetail-meta-label">Items</span>
            <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="OrderDetail-meta-item">
            <span className="OrderDetail-meta-label">Total</span>
            <span className="OrderDetail-meta-total">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
      </div>

      <h3 className="OrderDetail-section-title">Items</h3>
      <div className="OrderDetail-items">
        {items.length === 0 ? (
          <p className="text-muted OrderDetail-no-items">This order has no items yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="OrderDetail-item">
              <div className="OrderDetail-item-media">
                {item.product?.imageUrl ? (
                  <img src={item.product.imageUrl} alt={renderItemName(item)} />
                ) : (
                  <Icon name="box" size={20} />
                )}
              </div>
              <div className="OrderDetail-item-name">
                <span>{renderItemName(item)}</span>
                <span className="text-muted">
                  {formatPrice(item.price)} × {item.quantity}
                </span>
              </div>
              <span className="OrderDetail-item-total">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Add-item form — POST /orders/:order_id/items */}
      <form className="OrderDetail-add" onSubmit={handleAddItem}>
        <h3 className="OrderDetail-section-title">Add an item</h3>
        <div className="OrderDetail-add-row">
          <select
            className="OrderDetail-select"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatPrice(p.price)}
              </option>
            ))}
          </select>

          <input
            className="OrderDetail-qty"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-label="Quantity"
          />

          <button type="submit" className="btn btn-primary" disabled={isAdding}>
            {isAdding ? "Adding…" : <><Icon name="plus" size={16} /> Add</>}
          </button>
        </div>
        {addError && <div className="banner banner-error OrderDetail-add-error">{addError}</div>}
        <p className="text-muted OrderDetail-add-hint">
          Price is taken from the catalog and the order total updates automatically.
        </p>
      </form>
    </div>
  )
}

export default OrderDetail
