import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function FoundItems() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/found-items.php"
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
              CAMPUS LOST & FOUND
            </span>

            <h1>Found Items</h1>

            <p>
              Browse items found by students around campus.
            </p>
          </div>

          <div className="item-count">
            <strong>{items.length}</strong>
            <span>Found Items</span>
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
            <div className="empty-icon">🔎</div>

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
              <div className="item-card" key={item.id}>

                {/* Image */}
                <div className="item-image-wrapper">

                  {item.image_url ? (
                    <img
                      src={`http://localhost:8000/${item.image_url}`}
                      alt={item.title}
                      className="item-photo"
                    />
                  ) : (
                    <div className="no-image">
                      <span>📦</span>
                      <p>No image</p>
                    </div>
                  )}

                  <span className="found-status-badge">
                    FOUND
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
                    {item.description}
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

                  {/* Actions */}
                  <div className="item-actions">

                    {/* View Details */}
                    <button
                      className="view-item-btn"
                      onClick={() =>
                        navigate(`/item/${item.id}`)
                      }
                    >
                      View Details
                    </button>

                    {/* Claim */}
                    <button
                      className="claim-item-btn"
                      onClick={() =>
                        navigate(`/item/${item.id}`)
                      }
                    >
                      This Is My Item
                    </button>

                  </div>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default FoundItems;