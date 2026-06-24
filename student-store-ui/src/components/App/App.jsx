import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import axios from "axios"
import Header from "../Header/Header"
import CategoryBar from "../CategoryBar/CategoryBar"
import CartDrawer from "../CartDrawer/CartDrawer"
import Home from "../Home/Home"
import ProductDetail from "../ProductDetail/ProductDetail"
import Orders from "../Orders/Orders"
import OrderDetail from "../OrderDetail/OrderDetail"
import NotFound from "../NotFound/NotFound"
import {
  removeFromCart,
  addToCart,
  getQuantityOfItemInCart,
  getTotalItemsInCart,
} from "../../utils/cart"
import { API_BASE_URL } from "../../constants"
import "./App.css"

function App() {
  // ----- State -----
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All Categories")
  const [searchInputValue, setSearchInputValue] = useState("")
  const [userInfo, setUserInfo] = useState({ name: "", email: "", dorm_number: "" })
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [isFetching, setIsFetching] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  // Fetch all products once, on mount.
  useEffect(() => {
    const fetchProducts = async () => {
      setIsFetching(true)
      setError(null)
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`)
        setProducts(data)
      } catch (err) {
        setError("Failed to load products. Is the API running?")
      } finally {
        setIsFetching(false)
      }
    }
    fetchProducts()
  }, [])

  // ----- Cart handlers (lifted state) -----
  const handleOnRemoveFromCart = (item) => setCart(removeFromCart(cart, item))
  const handleOnAddToCart = (item) => setCart(addToCart(cart, item))
  const handleGetItemQuantity = (item) => getQuantityOfItemInCart(cart, item)

  const openCart = () => setCartOpen(true)
  const closeCart = () => setCartOpen(false)

  const handleOnSearchInputChange = (event) => setSearchInputValue(event.target.value)

  // ----- Checkout (unchanged contract with the API) -----
  const handleOnCheckout = async () => {
    const orderItems = Object.entries(cart).map(([product_id, quantity]) => ({
      product_id: Number(product_id),
      quantity,
    }))

    if (orderItems.length === 0) {
      setError("Your cart is empty. Add an item before checking out.")
      return
    }

    setIsCheckingOut(true)
    setError(null)
    try {
      // No customers table in this project, so customer_id is fixed at 1.
      // customer_email is captured from the cart form (used by the Past Orders filter).
      const { data } = await axios.post(`${API_BASE_URL}/orders`, {
        customer_id: 1,
        customer_email: userInfo.email || undefined,
        status: "pending",
        order_items: orderItems,
      })

      // Shape the response into the receipt the CartDrawer renders.
      setOrder({
        ...data,
        purchase: {
          receipt: {
            lines: [
              `Order #${data.id} placed!`,
              `Status: ${data.status}`,
              `Items: ${data.orderItems.length}`,
              `Total: $${data.totalPrice.toFixed(2)}`,
            ],
          },
        },
      })
      setCart({})
    } catch (err) {
      setError(err.response?.data?.error ?? "Checkout failed. Please try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <BrowserRouter>
      <div className="App">
        <Header
          searchValue={searchInputValue}
          onSearchChange={handleOnSearchInputChange}
          cartCount={getTotalItemsInCart(cart)}
          onCartClick={openCart}
        />

        <Routes>
          {/* Storefront — category bar + grid */}
          <Route
            path="/"
            element={
              <>
                <CategoryBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                <main className="App-main container">
                  <Home
                    error={error}
                    products={products}
                    isFetching={isFetching}
                    activeCategory={activeCategory}
                    searchInputValue={searchInputValue}
                    addToCart={handleOnAddToCart}
                    removeFromCart={handleOnRemoveFromCart}
                    getQuantityOfItemInCart={handleGetItemQuantity}
                  />
                </main>
              </>
            }
          />
          <Route
            path="/orders"
            element={
              <main className="App-main container">
                <Orders />
              </main>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <main className="App-main container">
                <OrderDetail products={products} />
              </main>
            }
          />
          <Route
            path="/:productId"
            element={
              <main className="App-main container">
                <ProductDetail
                  addToCart={handleOnAddToCart}
                  removeFromCart={handleOnRemoveFromCart}
                  getQuantityOfItemInCart={handleGetItemQuantity}
                  onOpenCart={openCart}
                />
              </main>
            }
          />
          <Route
            path="*"
            element={
              <main className="App-main container">
                <NotFound />
              </main>
            }
          />
        </Routes>

        <CartDrawer
          isOpen={cartOpen}
          onClose={closeCart}
          products={products}
          cart={cart}
          addToCart={handleOnAddToCart}
          removeFromCart={handleOnRemoveFromCart}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          onCheckout={handleOnCheckout}
          isCheckingOut={isCheckingOut}
          order={order}
          setOrder={setOrder}
          error={error}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
