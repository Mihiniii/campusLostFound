import { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import { Link } from "react-router-dom";
import { Plus, SearchX } from "lucide-react";
import ItemCard from "../components/ItemCard.jsx";

function LostItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        const response = await apiFetch(
          "lost-items.php"
        );

        const data = await response.json();

        if (data.success) {
          setItems(data.items);
        }
      } catch (error) {
        console.error("Failed to load lost items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLostItems();
  }, []);

  return (
    <div className="items-page">
      <div className="items-container">

        {/* Page Header */}
        <div className="items-header">
          <div>
            <span className="section-label">
              Campus Lost & Found
            </span>

            <h1>Lost Items</h1>

            <p>
              Browse items reported as lost by students around campus.
            </p>
          </div>

          <div className="items-header-side">

            <div className="item-count">
              <strong>{items.length}</strong>
              <span>Reported Items</span>
            </div>

            <Link to="/report-lost" className="primary-btn">
              <Plus size={18} />
              Report Lost Item
            </Link>

          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="state-message">
            <div className="loading-spinner"></div>
            <p>Loading lost items...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="state-message">
            <div className="empty-icon">
              <SearchX size={36} strokeWidth={1.5} />
            </div>

            <h3>No lost items yet</h3>

            <p>
              There are currently no lost items reported on campus.
            </p>
          </div>
        )}

        {/* Items */}
        {!loading && items.length > 0 && (
          <div className="items-grid">

            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                type="lost"
              />
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default LostItems;
