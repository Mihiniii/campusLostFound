import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Package } from "lucide-react";
import { API_URL } from "../api.js";

// One lost or found item in a list. The whole card opens the item page.
function ItemCard({ item, type }) {
  const navigate = useNavigate();

  const isLost = type === "lost";

  return (
    <article
      className="item-card"
      onClick={() => navigate(`/item/${item.id}`)}
    >

      {/* Image */}
      <div className="item-image-wrapper">

        {item.image_url ? (
          <img
            src={`${API_URL}/${item.image_url}`}
            alt={item.title}
            className="item-photo"
            loading="lazy"
          />
        ) : (
          <div className="no-image">
            <Package size={34} strokeWidth={1.5} />
            <p>No photo</p>
          </div>
        )}

        <span
          className={isLost ? "status-badge" : "found-status-badge"}
        >
          {isLost ? "Lost" : "Found"}
        </span>

      </div>

      {/* Content */}
      <div className="item-content">

        {item.category && (
          <span className="category-badge">
            {item.category}
          </span>
        )}

        <h3>{item.title}</h3>

        <p className="item-description">
          {item.description || "No description provided."}
        </p>

        {/* Meta Information */}
        <div className="item-meta">

          <div className="meta-row">
            <MapPin size={15} className="meta-icon" />
            <span>{item.location}</span>
          </div>

          <div className="meta-row">
            <Calendar size={15} className="meta-icon" />
            <span>{item.item_date}</span>
          </div>

        </div>

        <span className="view-item-btn">
          View Details
          <ArrowRight size={16} />
        </span>

      </div>

    </article>
  );
}

export default ItemCard;
