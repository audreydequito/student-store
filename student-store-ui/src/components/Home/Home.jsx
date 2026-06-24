import ProductGrid from "../ProductGrid/ProductGrid"
import "./Home.css"

// Storefront landing page: a hero banner plus the filtered product grid.
// Filtering (category + search) happens here on the client over the products
// already loaded in App.
function Home({
  isFetching,
  products,
  addToCart,
  removeFromCart,
  searchInputValue,
  getQuantityOfItemInCart,
  activeCategory,
  error,
}) {
  const productsByCategory =
    activeCategory && activeCategory !== "All Categories"
      ? products.filter((p) => p.category === activeCategory)
      : products

  const productsToShow = searchInputValue
    ? productsByCategory.filter(
        (p) => p.name.toLowerCase().indexOf(searchInputValue.toLowerCase()) !== -1
      )
    : productsByCategory

  return (
    <div className="Home">
      <section className="Home-hero">
        <div className="Home-hero-text">
          <span className="Home-hero-eyebrow">Campus essentials, delivered to your dorm</span>
          <h1>Everything you need for the semester.</h1>
          <p>Apparel, books, snacks and supplies — all in one student store.</p>
        </div>
      </section>

      {error && <div className="banner banner-error Home-error">{error}</div>}

      <div className="Home-toolbar">
        <h2 className="Home-title">
          {activeCategory === "All Categories" ? "All products" : activeCategory}
        </h2>
        {!isFetching && (
          <span className="text-muted Home-count">
            {productsToShow.length} item{productsToShow.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <ProductGrid
        products={productsToShow}
        isFetching={isFetching}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        getQuantityOfItemInCart={getQuantityOfItemInCart}
      />
    </div>
  )
}

export default Home
