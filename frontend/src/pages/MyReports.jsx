import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, apiFetch, apiPost } from "../api.js";
import { Check, MessageSquare, Package, Pencil, RotateCcw, Trash2 } from "lucide-react";

// The logged-in user's own reports, the claims on them,
// and the claims the user made on other reports
function MyReports() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const [items, setItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Increased after every change, so the data is loaded again
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadReports = async () => {
      try {
        const response = await apiFetch("my-items.php");

        const data = await response.json();

        if (data.success) {
          setItems(data.items);
          setMyClaims(data.my_claims);
        }
      } catch (error) {
        console.error("Failed to load reports:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [userId, reloadKey]);

  // Sends a change to the server, shows the answer and reloads the page data
  const sendChange = async (path, body) => {
    try {
      const response = await apiPost(path, body);

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        setReloadKey((key) => key + 1);
      }
    } catch (error) {
      console.error("Request error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleStatus = (item, status) => {
    sendChange("update-item-status.php", {
      item_id: item.id,
      status,
    });
  };

  const handleDelete = (item) => {
    const confirmDelete = window.confirm(
      `Delete "${item.title}"?\n\n` +
        "Its claims and messages will be deleted too. This cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    sendChange("delete-item.php", {
      item_id: item.id,
    });
  };

  const handleClaim = (claim, status) => {
    if (status === "accepted") {
      const confirmAccept = window.confirm(
        `Accept the claim from ${claim.claimant_name}?\n\n` +
          "The item will be marked as returned and other waiting claims will be rejected."
      );

      if (!confirmAccept) {
        return;
      }
    }

    sendChange("update-claim.php", {
      claim_id: claim.id,
      status,
    });
  };

  if (!user) {
    return (
      <div className="details-state">
        <h3>Please login to view your reports.</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="details-state">
        <div className="loading-spinner"></div>
        <p>Loading your reports...</p>
      </div>
    );
  }

  return (
    <div className="messages-page">

      <div className="messages-container">

        <div className="messages-header">
          <h1>My Reports</h1>
          <p>Manage the items you reported and answer claims on them.</p>
        </div>

        {items.length === 0 ? (

          <div className="messages-empty">

            <div className="messages-empty-icon">
              <Package size={36} strokeWidth={1.5} />
            </div>

            <h3>No reports yet</h3>

            <p>
              Items you report as lost or found will appear here.
            </p>

          </div>

        ) : (

          <div className="messages-list">

            {items.map((item) => {

              const isLost = item.type === "lost";
              const isReturned = item.status === "returned";

              return (
                <div className="message-card report-card" key={item.id}>

                  <div className="report-card-main">

                    {/* Image */}
                    <div className="report-thumb">
                      {item.image_url ? (
                        <img
                          src={`${API_URL}/${item.image_url}`}
                          alt={item.title}
                        />
                      ) : (
                        <Package size={28} strokeWidth={1.5} />
                      )}
                    </div>

                    <div className="report-card-info">

                      <div className="report-badges">

                        <span
                          className={`details-status ${
                            isLost ? "lost-status" : "found-status"
                          }`}
                        >
                          {isLost ? "LOST" : "FOUND"}
                        </span>

                        {isReturned && (
                          <span className="details-status returned-status">
                            RETURNED
                          </span>
                        )}

                      </div>

                      <h3>
                        <Link to={`/item/${item.id}`}>
                          {item.title}
                        </Link>
                      </h3>

                      <span className="message-direction">
                        {item.category} · {item.location} · {item.item_date}
                      </span>

                    </div>

                  </div>

                  {/* Actions */}
                  <div className="report-actions">

                    <button
                      type="button"
                      className="reply-cancel-btn"
                      onClick={() => navigate(`/edit-item/${item.id}`)}
                    >
                      <Pencil size={15} /> Edit
                    </button>

                    {isReturned ? (
                      <button
                        type="button"
                        className="reply-cancel-btn"
                        onClick={() => handleStatus(item, "active")}
                      >
                        <RotateCcw size={15} /> Mark as Active
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="reply-send-btn"
                        onClick={() => handleStatus(item, "returned")}
                      >
                        <Check size={15} /> Mark as Returned
                      </button>
                    )}

                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 size={15} /> Delete
                    </button>

                  </div>

                  {/* Claims on this report */}
                  {item.claims.length > 0 && (
                    <div className="report-claims">

                      <h4>
                        Claims ({item.claims.length})
                      </h4>

                      {item.claims.map((claim) => (
                        <div className="claim-row" key={claim.id}>

                          <div className="message-card-top">

                            <strong>
                              {claim.claimant_name}
                            </strong>

                            <span
                              className={`claim-status claim-${claim.status}`}
                            >
                              {claim.status}
                            </span>

                          </div>

                          <p className="message-text">
                            {claim.message}
                          </p>

                          <span className="message-date">
                            {new Date(
                              claim.created_at
                            ).toLocaleString()}
                          </span>

                          <div className="report-actions">

                            {claim.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  className="reply-send-btn"
                                  onClick={() =>
                                    handleClaim(claim, "accepted")
                                  }
                                >
                                  Accept
                                </button>

                                <button
                                  type="button"
                                  className="danger-btn"
                                  onClick={() =>
                                    handleClaim(claim, "rejected")
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="reply-cancel-btn"
                              onClick={() =>
                                navigate(
                                  `/messages?item=${item.id}&user=${claim.claimant_id}`,
                                  {
                                    state: {
                                      otherName: claim.claimant_name,
                                      itemTitle: item.title,
                                    },
                                  }
                                )
                              }
                            >
                              <MessageSquare size={15} /> Message
                            </button>

                          </div>

                        </div>
                      ))}

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        )}

        {/* Claims the user made */}
        {myClaims.length > 0 && (
          <>
            <div className="messages-header my-claims-header">
              <h2>My Claims</h2>
              <p>Claims you made on other people's reports.</p>
            </div>

            <div className="messages-list">

              {myClaims.map((claim) => (
                <div className="message-card" key={claim.id}>

                  <div className="message-card-top">

                    <h3>
                      <Link to={`/item/${claim.item_id}`}>
                        {claim.item_title}
                      </Link>
                    </h3>

                    <span
                      className={`claim-status claim-${claim.status}`}
                    >
                      {claim.status}
                    </span>

                  </div>

                  <p className="message-text">
                    {claim.message}
                  </p>

                  <span className="message-date">
                    {new Date(claim.created_at).toLocaleString()}
                  </span>

                </div>
              ))}

            </div>
          </>
        )}

      </div>

    </div>
  );
}

export default MyReports;
