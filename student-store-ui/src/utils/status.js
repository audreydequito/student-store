// Maps an order status string to its badge CSS class (defined in globals.css).
// Falls back to a neutral style for any unrecognized status.
export const statusBadgeClass = (status) => {
  const known = ["pending", "completed", "shipped", "cancelled"]
  const key = String(status || "").toLowerCase()
  return known.includes(key) ? `badge-${key}` : "badge-default"
}
