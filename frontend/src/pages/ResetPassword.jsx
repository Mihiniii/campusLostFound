import { useState } from "react";
import { apiPost } from "../api.js";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// Opened from the link in the password reset email: /reset-password?token=...
function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("The two passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiPost("reset-password.php", {
        token,
        password,
      });

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>New Password</h1>
        <p>
          Use at least 8 characters with an uppercase letter, a lowercase
          letter, and a number.
        </p>

        <form onSubmit={handleSubmit}>
          <label>New Password</label>

          <input
            type="password"
            placeholder="Enter a new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Enter the password again"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Change Password"}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
