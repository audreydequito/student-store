import ProductCard from "../ProductCard/ProductCard"
import Icon from "../Icon/Icon"
import "./ProductGrid.css"

// Renders the product grid with three display states: loading (skeletons),
// empty (no matches), and populated.
function ProductGrid({
  addToCart,
  removeFromCart,
  getQuantityOfItemInCart,
  products = [],
  isFetching,
}) {
  if (isFetching) {
    return (
      <div className="ProductGrid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="ProductGrid-skeleton">
            <div className="skeleton ProductGrid-skeleton-media" />
            <div className="skeleton ProductGrid-skeleton-line" />
            <div className="skeleton ProductGrid-skeleton-line short" />
          </div>
        ))}
      </div>
    )
  }

  if (!products?.length) {
    return (
      <div className="ProductGrid-empty">
        <div className="ProductGrid-empty-icon">
          <Icon name="search" size={32} />
        </div>
        <p className="ProductGrid-empty-title">No products found</p>
        <p className="text-muted">Try a different category or search term.</p>
      </div>
    )
  }

  return (
    <div className="ProductGrid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantity={getQuantityOfItemInCart(product)}
          addToCart={() => addToCart(product)}
          removeFromCart={() => removeFromCart(product)}
        />
      ))}
    </div>
  )
}

export default ProductGrid
