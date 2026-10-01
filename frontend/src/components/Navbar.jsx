import { Link, NavLink, useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import Logo from "./Logo.jsx";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
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
      <div className="navbar-inner">

        <Link to="/" className="logo" aria-label="Campus Lost & Found home">
          <Logo />
        </Link>

        {/* Menu button, shown on small screens */}
        <button
          type="button"
          className="menu-btn"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Clicking any link closes the small-screen menu */}
        <div
          className={`nav-links ${menuOpen ? "nav-open" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/lost-items">Lost Items</NavLink>
          <NavLink to="/found-items">Found Items</NavLink>

          <NavLink to="/messages" className="messages-nav-link">
            Messages

            {unreadCount > 0 && (
              <span className="message-badge">
                {unreadCount}
              </span>
            )}
          </NavLink>

          {user && (
            <NavLink to="/my-reports" className="messages-nav-link">
              My Reports

              {pendingClaims > 0 && (
                <span className="message-badge">
                  {pendingClaims}
                </span>
              )}
            </NavLink>
          )}

          {/* The server checks the role again on every admin request */}
          {user?.role === "admin" && (
            <NavLink to="/admin">Admin</NavLink>
          )}

          <span className="nav-divider"></span>

          {user ? (
            <>
              <span className="user-name">
                <span className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </span>

                {user.name}
              </span>

              <button
                onClick={handleLogout}
                className="logout-btn"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login-link">
                Login
              </Link>

              <Link to="/register" className="login-btn">
                Sign Up
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;