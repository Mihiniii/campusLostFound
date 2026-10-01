import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/get-unread-count.php?user_id=${user.id}`
        );

        const data = await response.json();

        if (data.success) {
          setUnreadCount(data.unread_count);
        }
      } catch (error) {
        console.error("Failed to fetch unread messages:", error);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
  const confirmLogout = window.confirm(
    "Are you sure you want to logout?"
  );

  if (!confirmLogout) {
    return;
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