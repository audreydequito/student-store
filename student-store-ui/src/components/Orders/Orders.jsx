import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import Icon from "../Icon/Icon"
import { formatPrice, formatDate } from "../../utils/format"
import { statusBadgeClass } from "../../utils/status"
import { API_BASE_URL } from "../../constants"
import "./Orders.css"

// Past Orders page: lists all orders (newest first), filterable by the email
// of the person who placed them (server-side via ?email=).
function Orders() {
  const [orders, setOrders] = useState([])
  const [emailFilter, setEmailFilter] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      setIsFetching(true)
      setError(null)
      try {
        const params = { sort: "id_desc" }
        if (emailFilter.trim()) params.email = emailFilter.trim()
        const { data } = await axios.get(`${API_BASE_URL}/orders`, { params })
        setOrders(data)
      } catch (err) {
        setError("Failed to load orders. Is the API running?")
      } finally {
        setIsFetching(false)
      }
    }
    fetchOrders()
  }, [emailFilter])

  return (
    <div className="Orders">
      <div className="Orders-header">
        <div>
          <h1>Past orders</h1>
          <p className="text-muted">Track and review previous purchases.</p>
        </div>
        <Link to="/" className="btn btn-ghost">
          <Icon name="arrowLeft" size={16} /> Store
        </Link>
      </div>

      <div className="Orders-search">
        <Icon name="search" size={18} className="Orders-search-icon" />
        <input
          type="text"
          placeholder="Filter by customer email…"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
        />
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      {isFetching && (
        <div className="Orders-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton Orders-skeleton" />
          ))}
        </div>
      )}

      {!isFetching && !error && orders.length === 0 && (
        <div className="Orders-empty">
          <div className="Orders-empty-icon">
            <Icon name="receipt" size={32} />
          </div>
          <p className="Orders-empty-title">No orders yet</p>
          <p className="text-muted">Orders you place will appear here.</p>
        </div>
      )}

      {!isFetching && orders.length > 0 && (
        <div className="Orders-list">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="Orders-row">
              <div className="Orders-row-main">
                <span className="Orders-row-id">Order #{order.id}</span>
                <span className="text-muted Orders-row-email">{order.customerEmail || "No email"}</span>
              </div>
              <div className="Orders-row-meta">
                <span className={`badge ${statusBadgeClass(order.status)}`}>{order.status}</span>
                <span className="text-muted Orders-row-count">
                  {order.orderItems.length} item{order.orderItems.length === 1 ? "" : "s"}
                </span>
                <span className="Orders-row-total">{formatPrice(order.totalPrice)}</span>
                <span className="text-muted Orders-row-date">{formatDate(order.createdAt)}</span>
                <Icon name="arrowRight" size={18} className="Orders-row-chevron" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
