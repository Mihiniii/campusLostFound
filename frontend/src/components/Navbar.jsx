import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";
import { useEffect, useState } from "react";

function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingClaims, setPendingClaims] = useState(0);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setPendingClaims(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await apiFetch(
          "get-unread-count.php"
        );

        const data = await response.json();

        if (data.success) {
          setUnreadCount(data.unread_count);
          setPendingClaims(data.pending_claims);
        }
      } catch (error) {
        console.error("Failed to fetch unread messages:", error);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleLogout = async () => {
  const confirmLogout = window.confirm(
    "Are you sure you want to logout?"
  );

  if (!confirmLogout) {
    return;
  }

  // End the session on the server
  try {
    await apiFetch("logout.php", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  localStorage.removeItem("user");
  navigate("/login");
};

  return (
    <nav className="navbar">
      <div className="logo">
        Campus Lost & Found
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/lost-items">Lost Items</Link>
        <Link to="/found-items">Found Items</Link>

        <Link to="/messages" className="messages-nav-link">
          📩 Messages

          {unreadCount > 0 && (
            <span className="message-badge">
              {unreadCount}
            </span>
          )}
        </Link>

        {user && (
          <Link to="/my-reports" className="messages-nav-link">
            My Reports

            {pendingClaims > 0 && (
              <span className="message-badge">
                {pendingClaims}
              </span>
            )}
          </Link>
        )}

        {/* The server checks the role again on every admin request */}
        {user?.role === "admin" && (
          <Link to="/admin">Admin</Link>
        )}

        {user ? (
          <>
            <span className="user-name">
              Hi, {user.name}
            </span>

            <button
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;