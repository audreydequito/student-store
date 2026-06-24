import { Link } from "react-router-dom"
import Icon from "../Icon/Icon"
import { formatPrice } from "../../utils/format"
import "./ProductCard.css"

// A single product tile. The image + name link through to the detail page,
// while the add / quantity-stepper control lives inline so users can build a
// cart without leaving the grid.
function ProductCard({ product, quantity, addToCart, removeFromCart }) {
  return (
    <article className="ProductCard">
      <Link to={`/${product.id}`} className="ProductCard-media">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="ProductCard-media-fallback">
            <Icon name="box" size={34} />
          </div>
        )}
        {product.category && <span className="ProductCard-tag">{product.category}</span>}
      </Link>

      <div className="ProductCard-body">
        <Link to={`/${product.id}`} className="ProductCard-name">
          {product.name}
        </Link>
        <div className="ProductCard-row">
          <span className="ProductCard-price">{formatPrice(product.price)}</span>

          {quantity > 0 ? (
            <div className="stepper">
              <button onClick={removeFromCart} aria-label={`Remove one ${product.name}`}>
                <Icon name={quantity === 1 ? "trash" : "minus"} size={16} />
              </button>
              <span className="count">{quantity}</span>
              <button onClick={addToCart} aria-label={`Add one ${product.name}`}>
                <Icon name="plus" size={16} />
              </button>
            </div>
          ) : (
            <button className="ProductCard-add btn btn-primary" onClick={addToCart}>
              <Icon name="plus" size={16} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProductCard
