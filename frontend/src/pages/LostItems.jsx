
import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "../api.js";
import { useNavigate } from "react-router-dom";

function LostItems() {
  const navigate = useNavigate();

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
              CAMPUS LOST & FOUND
            </span>

            <h1>Lost Items</h1>

            <p>
              Browse items reported as lost by students around campus.
            </p>
          </div>

          <div className="item-count">
            <strong>{items.length}</strong>
            <span>Reported Items</span>
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
            <div className="empty-icon">🔍</div>

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
              <div
                className="item-card"
                key={item.id}
              >

                {/* Image */}
                <div className="item-image-wrapper">

                  {item.image_url ? (
                    <img
                      src={`${API_URL}/${item.image_url}`}
                      alt={item.title}
                      className="item-photo"
                    />
                  ) : (
                    <div className="no-image">
                      <span>📦</span>
                      <p>No image</p>
                    </div>
                  )}

                  {/* Lost Badge */}
                  <span className="status-badge">
                    LOST
                  </span>

                </div>

                {/* Content */}
                <div className="item-content">

                  {/* Category */}
                  <span className="category-badge">
                    {item.category}
                  </span>

                  {/* Title */}
                  <h3>{item.title}</h3>

                  {/* Description */}
                  <p className="item-description">
                    {item.description || "No description provided."}
                  </p>

                  {/* Meta Information */}
                  <div className="item-meta">

                    <div className="meta-row">
                      <span className="meta-icon">📍</span>
                      <span>{item.location}</span>
                    </div>

                    <div className="meta-row">
                      <span className="meta-icon">📅</span>
                      <span>{item.item_date}</span>
                    </div>

                  </div>

                  {/* View Details Button */}
                  <button
                    type="button"
                    className="view-item-btn"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    <span>View Details</span>
                    
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default LostItems;
