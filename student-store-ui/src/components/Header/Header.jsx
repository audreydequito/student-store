import { Link, NavLink } from "react-router-dom"
import Icon from "../Icon/Icon"
import "./Header.css"

// Sticky top bar: brand, product search, "Orders" link, and a cart button
// that shows a live item-count badge and opens the cart drawer.
function Header({ searchValue, onSearchChange, cartCount, onCartClick }) {
  return (
    <header className="Header">
      <div className="Header-inner container">
        <Link to="/" className="Header-brand" aria-label="Campus Cart home">
          <span className="Header-logo">
            <Icon name="bag" size={20} />
          </span>
          <span className="Header-brand-name">
            Campus<span>Cart</span>
          </span>
        </Link>

        <div className="Header-search">
          <Icon name="search" size={18} className="Header-search-icon" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchValue}
            onChange={onSearchChange}
            aria-label="Search products"
          />
        </div>

        <nav className="Header-actions">
          <NavLink to="/orders" className="Header-link">
            <Icon name="receipt" size={20} />
            <span className="Header-link-text">Orders</span>
          </NavLink>

          <button className="Header-cart" onClick={onCartClick} aria-label="Open cart">
            <Icon name="cart" size={22} />
            {cartCount > 0 && <span className="Header-cart-badge">{cartCount}</span>}
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
