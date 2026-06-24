import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import NotFound from "../NotFound/NotFound"
import Icon from "../Icon/Icon"
import { formatPrice } from "../../utils/format"
import { API_BASE_URL } from "../../constants"
import "./ProductDetail.css"

// Single-product page. Fetches the product by the :productId in the URL and
// offers the same add/remove-from-cart controls as the grid, plus a shortcut
// to open the cart drawer once something has been added.
function ProductDetail({ addToCart, removeFromCart, getQuantityOfItemInCart, onOpenCart }) {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      setIsFetching(true)
      setError(null)
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products/${productId}`)
        setProduct(data)
      } catch (err) {
        setError(err.response?.data?.error ?? "Failed to load product.")
      } finally {
        setIsFetching(false)
      }
    }
    fetchProduct()
  }, [productId])

  if (error) return <NotFound />

  if (isFetching || !product) {
    return (
      <div className="ProductDetail">
        <div className="ProductDetail-card">
          <div className="skeleton ProductDetail-media" />
          <div className="ProductDetail-info">
            <div className="skeleton ProductDetail-skeleton-line" />
            <div className="skeleton ProductDetail-skeleton-line short" />
            <div className="skeleton ProductDetail-skeleton-block" />
          </div>
        </div>
      </div>
    )
  }

  const quantity = getQuantityOfItemInCart(product)

  return (
    <div className="ProductDetail">
      <nav className="ProductDetail-breadcrumb">
        <Link to="/">
          <Icon name="arrowLeft" size={16} /> Back to store
        </Link>
      </nav>

      <div className="ProductDetail-card">
        <div className="ProductDetail-media">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="ProductDetail-media-fallback">
              <Icon name="box" size={56} />
            </div>
          )}
        </div>

        <div className="ProductDetail-info">
          {product.category && <span className="ProductDetail-category">{product.category}</span>}
          <h1 className="ProductDetail-name">{product.name}</h1>
          <p className="ProductDetail-price">{formatPrice(product.price)}</p>
          {product.description && (
            <p className="ProductDetail-description">{product.description}</p>
          )}

          <div className="ProductDetail-actions">
            {quantity > 0 ? (
              <>
                <div className="stepper ProductDetail-stepper">
                  <button onClick={() => removeFromCart(product)} aria-label="Remove one">
                    <Icon name={quantity === 1 ? "trash" : "minus"} size={18} />
                  </button>
                  <span className="count">{quantity}</span>
                  <button onClick={() => addToCart(product)} aria-label="Add one">
                    <Icon name="plus" size={18} />
                  </button>
                </div>
                <button className="btn btn-primary" onClick={onOpenCart}>
                  <Icon name="cart" size={18} /> View cart
                </button>
              </>
            ) : (
              <button className="btn btn-primary ProductDetail-add" onClick={() => addToCart(product)}>
                <Icon name="plus" size={18} /> Add to cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
