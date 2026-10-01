import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, apiPost } from "../api.js";

// Admin area: every report and every user.
// The server checks the admin role on each request.
function Admin() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  const [tab, setTab] = useState("reports");
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);

  // Increased after every change, so the data is loaded again
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadData = async () => {
      try {
        const [itemsResponse, usersResponse] = await Promise.all([
          apiFetch("admin-items.php"),
          apiFetch("admin-users.php"),
        ]);

        const itemsData = await itemsResponse.json();
        const usersData = await usersResponse.json();

        if (itemsData.success && usersData.success) {
          setItems(itemsData.items);
          setUsers(usersData.users);
        } else {
          setAllowed(false);
        }
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  const handleDelete = (item) => {
    const confirmDelete = window.confirm(
      `Delete "${item.title}" reported by ${item.reported_by}?\n\n` +
        "Its claims and messages will be deleted too. This cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    sendChange("delete-item.php", {
      item_id: item.id,
    });
  };

  const handleStatus = (item) => {
    sendChange("update-item-status.php", {
      item_id: item.id,
      status: item.status === "returned" ? "active" : "returned",
    });
  };

  const handleRole = (account) => {
    const role = account.role === "admin" ? "student" : "admin";

    const confirmRole = window.confirm(
      role === "admin"
        ? `Make ${account.name} an admin?`
        : `Remove the admin role from ${account.name}?`
    );

    if (!confirmRole) {
      return;
    }

    sendChange("admin-update-user.php", {
      user_id: account.id,
      role,
    });
  };

  if (!user || !allowed) {
    return (
      <div className="details-state">
        <h3>This page is for admins only.</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="details-state">
        <div className="loading-spinner"></div>
        <p>Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="messages-page">

      <div className="messages-container admin-container">

        <div className="messages-header">
          <h1>Admin</h1>
          <p>Manage all reports and users.</p>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">

          <button
            type="button"
            className={tab === "reports" ? "active-tab" : ""}
            onClick={() => setTab("reports")}
          >
            Reports ({items.length})
          </button>

          <button
            type="button"
            className={tab === "users" ? "active-tab" : ""}
            onClick={() => setTab("users")}
          >
            Users ({users.length})
          </button>

        </div>

        {/* Reports */}
        {tab === "reports" && (
          <div className="admin-table-wrapper">
            <table className="admin-table">

              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>

                    <td>
                      <Link to={`/item/${item.id}`}>
                        {item.title}
                      </Link>

                      <span className="message-direction">
                        {item.category} · {item.location}
                      </span>
                    </td>

                    <td>{item.type}</td>

                    <td>
                      <span
                        className={`claim-status ${
                          item.status === "returned"
                            ? "claim-accepted"
                            : "claim-pending"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      {item.reported_by}

                      <span className="message-direction">
                        {item.reported_by_email}
                      </span>
                    </td>

                    <td>{item.item_date}</td>

                    <td>
                      <div className="report-actions">

                        <button
                          type="button"
                          className="reply-cancel-btn"
                          onClick={() =>
                            navigate(`/edit-item/${item.id}`)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="reply-cancel-btn"
                          onClick={() => handleStatus(item)}
                        >
                          {item.status === "returned"
                            ? "Reopen"
                            : "Close"}
                        </button>

                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="admin-table-wrapper">
            <table className="admin-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Reports</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((account) => (
                  <tr key={account.id}>

                    <td>{account.name}</td>

                    <td>
                      {account.email}

                      {!account.email_verified && (
                        <span className="message-direction">
                          Not verified
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`claim-status ${
                          account.role === "admin"
                            ? "claim-accepted"
                            : "claim-pending"
                        }`}
                      >
                        {account.role}
                      </span>
                    </td>

                    <td>{account.item_count}</td>

                    <td>
                      {new Date(
                        account.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {Number(account.id) === Number(userId) ? (
                        <span className="message-direction">
                          You
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="reply-cancel-btn"
                          onClick={() => handleRole(account)}
                        >
                          {account.role === "admin"
                            ? "Remove Admin"
                            : "Make Admin"}
                        </button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

    </div>
  );
}

export default Admin;
