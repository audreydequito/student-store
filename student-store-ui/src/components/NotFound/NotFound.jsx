import { Link } from "react-router-dom"
import Icon from "../Icon/Icon"
import "./NotFound.css"

function NotFound() {
  return (
    <div className="NotFound">
      <div className="NotFound-icon">
        <Icon name="search" size={40} />
      </div>
      <h1>404</h1>
      <p className="NotFound-title">We couldn't find that page</p>
      <p className="text-muted">The product or page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary NotFound-btn">
        <Icon name="bag" size={18} /> Back to store
      </Link>
    </div>
  )
}

export default NotFound
