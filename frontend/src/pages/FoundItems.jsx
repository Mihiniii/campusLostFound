import { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { Link } from "react-router-dom";
import { Plus, SearchX } from "lucide-react";
import ItemCard from "../components/ItemCard.jsx";

function FoundItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const response = await apiFetch(
          "found-items.php"
        );

        const data = await response.json();

        if (data.success) {
          setItems(data.items);
        }
      } catch (error) {
        console.error("Failed to load found items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFoundItems();
  }, []);

  return (
    <div className="items-page">
      <div className="items-container">

        {/* Header */}
        <div className="items-header">
          <div>
            <span className="section-label">
              Campus Lost & Found
            </span>

            <h1>Found Items</h1>

            <p>
              Browse items found by students around campus.
            </p>
          </div>

          <div className="items-header-side">

            <div className="item-count">
              <strong>{items.length}</strong>
              <span>Found Items</span>
            </div>

            <Link to="/report-found" className="primary-btn">
              <Plus size={18} />
              Report Found Item
            </Link>

          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="state-message">
            <div className="loading-spinner"></div>
            <p>Loading found items...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="state-message">
            <div className="empty-icon">
              <SearchX size={36} strokeWidth={1.5} />
            </div>

            <h3>No found items yet</h3>

            <p>
              There are currently no found items reported on campus.
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && items.length > 0 && (
          <div className="items-grid">

            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                type="found"
              />
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default FoundItems;
