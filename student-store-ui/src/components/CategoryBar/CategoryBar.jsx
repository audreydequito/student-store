import "./CategoryBar.css"

// Horizontally scrollable category filter pills. The set of categories
// matches the seeded product data (plus an "All Categories" reset).
const CATEGORIES = ["All Categories", "Accessories", "Apparel", "Books", "Snacks", "Supplies"]

function CategoryBar({ activeCategory, setActiveCategory }) {
  return (
    <div className="CategoryBar">
      <div className="CategoryBar-inner container">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className={`CategoryBar-pill ${activeCategory === category ? "is-active" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryBar
