import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

function ItemDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Claim states
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Message states
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Check logged-in user
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/item-details.php?id=${id}`
        );

        const data = await response.json();

        if (data.success) {
          setItem(data.item);
        }
      } catch (error) {
        console.error("Failed to load item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // =========================
  // CLAIM
  // =========================

  const handleClaimClick = () => {
    if (!user) {
      alert("Please login to continue.");
      return;
    }

    setShowClaimForm(true);
  };

  const handleSubmitClaim = async () => {
    if (!user) {
      alert("Please login before submitting a claim.");
      return;
    }

    if (!claimMessage.trim()) {
      alert("Please enter a message.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/submit-claim.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            item_id: item.id,
            user_id: user.id,
            message: claimMessage.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Claim submitted successfully!");

        setClaimMessage("");
        setShowClaimForm(false);
      } else {
        alert(data.message || "Failed to submit claim.");
      }
    } catch (error) {
      console.error("Claim submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // INTERNAL MESSAGE
  // =========================

  const handleMessageClick = () => {
  if (!user) {
    const goToLogin = window.confirm(
      "Please login to contact the reporter.\n\nClick OK to go to the Login page."
    );

    if (goToLogin) {
      navigate("/login");
    }

    return;
  }

  if (!item.reported_by_id) {
    alert("Reporter information is not available.");
    return;
  }

  if (Number(user.id) === Number(item.reported_by_id)) {
    alert("You cannot send a message to yourself.");
    return;
  }

  setShowMessageForm(true);
};

  const handleSendMessage = async () => {
    if (!user) {
      alert("Please login before sending a message.");
      return;
    }

    if (!messageText.trim()) {
      alert("Please enter a message.");
      return;
    }

    if (!item.reported_by_id) {
      alert("Reporter information is not available.");
      return;
    }

    setSendingMessage(true);

    try {
      const response = await fetch(
        "http://localhost:8000/api/send-message.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_id: user.id,
            receiver_id: item.reported_by_id,
            item_id: item.id,
            message: messageText.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Message sent successfully!");

        setMessageText("");
        setShowMessageForm(false);
      } else {
        alert(data.message || "Failed to send message.");
      }
    } catch (error) {
      console.error("Message sending error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="details-state">
        <div className="loading-spinner"></div>
        <p>Loading item details...</p>
      </div>
    );
  }

  // =========================
  // ITEM NOT FOUND
  // =========================

  if (!item) {
    return (
      <div className="details-state">
        <h3>Item not found</h3>

        <Link to="/lost-items" className="back-link">
          ← Back to Items
        </Link>
      </div>
    );
  }

  const isLost = item.type === "lost";

  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);

  return (
    <div className="details-page">

      <div className="details-container">

        {/* Back Button */}
        <Link
          to={isLost ? "/lost-items" : "/found-items"}
          className="back-link"
        >
          ← Back to {isLost ? "Lost Items" : "Found Items"}
        </Link>

        {/* Main Card */}
        <div className="details-card">

          {/* Image */}
          <div className="details-image-section">

            {item.image_url ? (
              <img
                src={`http://localhost:8000/${item.image_url}`}
                alt={item.title}
                className="details-image"
              />
            ) : (
              <div className="details-no-image">
                <span>📦</span>
                <p>No image available</p>
              </div>
            )}

          </div>

          {/* Content */}
          <div className="details-content">

            {/* Category + Status */}
            <div className="details-top">

              <span className="details-category">
                {item.category}
              </span>

              <span
                className={`details-status ${
                  isLost ? "lost-status" : "found-status"
                }`}
              >
                {isLost ? "LOST" : "FOUND"}
              </span>

            </div>

            {/* Title */}
            <h1>{item.title}</h1>

            {/* Description */}
            <p className="details-description">
              {item.description}
            </p>

            {/* Information */}
            <div className="details-info">

              <div className="details-info-item">
                <div className="details-icon">📍</div>

                <div>
                  <span>Location</span>
                  <strong>{item.location}</strong>
                </div>
              </div>

              <div className="details-info-item">
                <div className="details-icon">📅</div>

                <div>
                  <span>Date</span>
                  <strong>{item.item_date}</strong>
                </div>
              </div>

              <div className="details-info-item">
                <div className="details-icon">📂</div>

                <div>
                  <span>Category</span>
                  <strong>{item.category}</strong>
                </div>
              </div>

              <div className="details-info-item">
                <div className="details-icon">👤</div>

                <div>
                  <span>Reported By</span>
                  <strong>{item.reported_by}</strong>
                </div>
              </div>

            </div>

            {/* Location Map */}
            <div className="location-map-section">

              <h3>📍 Item Location</h3>

              {Number.isFinite(latitude) &&
              Number.isFinite(longitude) ? (

                <MapContainer
                  center={[latitude, longitude]}
                  zoom={17}
                  scrollWheelZoom={false}
                  className="location-map"
                >

                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <Marker
                    position={[latitude, longitude]}
                  >
                    <Popup>
                      {item.location}
                    </Popup>
                  </Marker>

                </MapContainer>

              ) : (
                <p>
                  Location map is not available.
                </p>
              )}

            </div>

            {/* Action */}
            <div className="details-action">

              {/* NOT LOGGED IN */}
              {!user ? (
                <>
                  <h3>
                    Want to contact the reporter?
                  </h3>

                  <p>
                    Please login to contact the person who
                    reported this item.
                  </p>

                  <button
                    className="details-action-btn"
                    onClick={handleMessageClick}
                  >
                    Login to Continue
                  </button>
                </>
              ) : (
                <>
                  {/* Message Button */}
                  <>
                    <h3>
                      Contact {item.reported_by}
                    </h3>

                    <p>
                      Send a private message to the person
                      who reported this item.
                    </p>

                    <button
                      type="button"
                      className="details-action-btn"
                      onClick={handleMessageClick}
                    >
                      💬 Send Message
                    </button>
                  </>

                  {/* Message Form */}
                  {showMessageForm && (
                    <div className="claim-form">

                      <div className="claim-form-header">

                        <h3>
                          Message {item.reported_by}
                        </h3>

                        <button
                          type="button"
                          className="claim-close-btn"
                          onClick={() => {
                            setShowMessageForm(false);
                            setMessageText("");
                          }}
                        >
                          ×
                        </button>

                      </div>

                      <p>
                        Your message will be sent privately to the
                        person who reported this item.
                      </p>

                      <textarea
                        value={messageText}
                        onChange={(e) =>
                          setMessageText(e.target.value)
                        }
                        placeholder="Write your message..."
                        rows="5"
                      />

                      <button
                        type="button"
                        className="claim-submit-btn"
                        onClick={handleSendMessage}
                        disabled={sendingMessage}
                      >
                        {sendingMessage
                          ? "Sending..."
                          : "Send Message"}
                      </button>

                    </div>
                  )}

                  {/* Existing Claim Section */}
                  {isLost ? (
                    <>
                      <h3>
                        <br></br>Did you find this item?
                      </h3>

                      <p>
                        If you found this item, you can submit
                        a claim with information about where
                        and how you found it.
                      </p>

                      <button
                        className="details-action-btn"
                        onClick={handleClaimClick}
                      >
                        I Found This Item
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>
                        Is this your item?
                      </h3>

                      <p>
                        If you believe this item belongs to you,
                        submit a claim with some details to verify
                        ownership.
                      </p>

                      <button
                        className="details-action-btn"
                        onClick={handleClaimClick}
                      >
                        This Is My Item
                      </button>
                    </>
                  )}

                  {/* Claim Form */}
                  {showClaimForm && (
                    <div className="claim-form">

                      <div className="claim-form-header">

                        <h3>
                          {isLost
                            ? "Report Found Item"
                            : "Claim This Item"}
                        </h3>

                        <button
                          type="button"
                          className="claim-close-btn"
                          onClick={() => {
                            setShowClaimForm(false);
                            setClaimMessage("");
                          }}
                        >
                          ×
                        </button>

                      </div>

                      <p>
                        {isLost
                          ? "Tell the owner where and how you found this item."
                          : "Provide some information to help verify that this item belongs to you."}
                      </p>

                      <textarea
                        value={claimMessage}
                        onChange={(e) =>
                          setClaimMessage(e.target.value)
                        }
                        placeholder={
                          isLost
                            ? "Example: I found this item near the library..."
                            : "Example: I can identify the unique mark on this item..."
                        }
                        rows="5"
                      />

                      <button
                        type="button"
                        className="claim-submit-btn"
                        onClick={handleSubmitClaim}
                        disabled={submitting}
                      >
                        {submitting
                          ? "Submitting..."
                          : "Submit Claim"}
                      </button>

                    </div>
                  )}

                </>
              )}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetails;