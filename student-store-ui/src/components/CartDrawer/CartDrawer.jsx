import { Link } from "react-router-dom"
import Icon from "../Icon/Icon"
import { formatPrice } from "../../utils/format"
import {
  calculateOrderSubtotal,
  calculateTaxesAndFees,
  calculateTotal,
} from "../../utils/calculations"
import "./CartDrawer.css"

// Slide-out cart. Three states share one shell:
//   1. order placed  -> success receipt
//   2. empty cart     -> empty state
//   3. items in cart  -> line items + totals + email + checkout
function CartDrawer({
  isOpen,
  onClose,
  products,
  cart,
  addToCart,
  removeFromCart,
  userInfo,
  setUserInfo,
  onCheckout,
  isCheckingOut,
  order,
  setOrder,
  error,
}) {
  // Join the cart map { [id]: qty } against the loaded products to build
  // renderable line items with live per-line totals.
  const lineItems = Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find((p) => String(p.id) === String(id))
      if (!product) return null
      return { ...product, quantity, lineTotal: product.price * quantity }
    })
    .filter(Boolean)

  const subtotal = calculateOrderSubtotal(lineItems)
  const taxes = calculateTaxesAndFees(subtotal)
  const total = calculateTotal(subtotal)

  const handleClosed = () => {
    // Clearing the order resets the drawer back to the cart view next open.
    if (order) setOrder(null)
    onClose()
  }

  return (
    <>
      <div
        className={`CartDrawer-overlay ${isOpen ? "open" : ""}`}
        onClick={handleClosed}
      />
      <aside
        className={`CartDrawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <header className="CartDrawer-head">
          <h2>
            {order ? (
              <>
                <Icon name="checkCircle" size={20} /> Order confirmed
              </>
            ) : (
              <>
                <Icon name="cart" size={20} /> Your cart
              </>
            )}
          </h2>
          <button className="CartDrawer-close" onClick={handleClosed} aria-label="Close cart">
            <Icon name="close" size={22} />
          </button>
        </header>

        <div className="CartDrawer-body">
          {error && <div className="banner banner-error">{error}</div>}

          {/* 1 — success receipt */}
          {order ? (
            <div className="CartDrawer-success">
              <div className="CartDrawer-success-icon">
                <Icon name="checkCircle" size={40} />
              </div>
              <p className="CartDrawer-success-title">Thanks for your order!</p>
              <p className="text-muted CartDrawer-success-sub">
                A confirmation will be sent so you can confirm delivery to your dorm.
              </p>

              <div className="CartDrawer-receipt">
                {order.purchase?.receipt?.lines?.map((line, i) => (
                  <div key={i} className={`CartDrawer-receipt-line ${i === 0 ? "head" : ""}`}>
                    {line}
                  </div>
                ))}
              </div>

              <div className="CartDrawer-success-actions">
                <Link to={`/orders/${order.id}`} className="btn btn-primary btn-block" onClick={handleClosed}>
                  <Icon name="box" size={18} /> View order
                </Link>
                <button className="btn btn-ghost btn-block" onClick={handleClosed}>
                  Keep shopping
                </button>
              </div>
            </div>
          ) : lineItems.length === 0 ? (
            /* 2 — empty */
            <div className="CartDrawer-empty">
              <div className="CartDrawer-empty-icon">
                <Icon name="cart" size={36} />
              </div>
              <p className="CartDrawer-empty-title">Your cart is empty</p>
              <p className="text-muted">Browse the store and add items to get started.</p>
              <button className="btn btn-secondary" onClick={handleClosed}>
                Start shopping
              </button>
            </div>
          ) : (
            /* 3 — cart with items */
            <>
              <ul className="CartDrawer-items">
                {lineItems.map((item) => (
                  <li key={item.id} className="CartDrawer-item">
                    <div className="CartDrawer-item-media">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} />
                      ) : (
                        <Icon name="box" size={22} />
                      )}
                    </div>
                    <div className="CartDrawer-item-info">
                      <Link to={`/${item.id}`} className="CartDrawer-item-name" onClick={handleClosed}>
                        {item.name}
                      </Link>
                      <span className="text-muted CartDrawer-item-price">
                        {formatPrice(item.price)} each
                      </span>
                      <div className="CartDrawer-item-controls">
                        <div className="stepper">
                          <button onClick={() => removeFromCart(item)} aria-label={`Remove one ${item.name}`}>
                            <Icon name={item.quantity === 1 ? "trash" : "minus"} size={16} />
                          </button>
                          <span className="count">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} aria-label={`Add one ${item.name}`}>
                            <Icon name="plus" size={16} />
                          </button>
                        </div>
                        <span className="CartDrawer-item-total">{formatPrice(item.lineTotal)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="CartDrawer-totals">
                <div className="CartDrawer-total-row">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="CartDrawer-total-row">
                  <span className="text-muted">Taxes &amp; fees</span>
                  <span>{formatPrice(taxes)}</span>
                </div>
                <div className="CartDrawer-total-row grand">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <label className="CartDrawer-field">
                <span>Email for receipt <span className="text-muted">(optional)</span></span>
                <div className="CartDrawer-input">
                  <Icon name="mail" size={16} className="CartDrawer-input-icon" />
                  <input
                    type="email"
                    placeholder="you@school.edu"
                    value={userInfo.email || ""}
                    onChange={(e) => setUserInfo((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </label>
            </>
          )}
        </div>

        {/* Sticky checkout footer (only for the active-cart state) */}
        {!order && lineItems.length > 0 && (
          <footer className="CartDrawer-foot">
            <button className="btn btn-primary btn-block" onClick={onCheckout} disabled={isCheckingOut}>
              {isCheckingOut ? "Placing order…" : `Checkout · ${formatPrice(total)}`}
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}

export default CartDrawer
