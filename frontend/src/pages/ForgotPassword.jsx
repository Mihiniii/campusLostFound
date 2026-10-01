import { useState } from "react";
import { apiPost, openDevLink } from "../api.js";
import { Link, useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSending(true);

    try {
      const response = await apiPost("forgot-password.php", {
        email,
      });

      const data = await response.json();

      alert(data.message);

      if (data.success) {
        openDevLink(data, navigate);
      }
    } catch (error) {
      console.error(error);
      alert("Could not connect to server.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p>
          Enter your email and we will send you a link to choose a new
          password.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="auth-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
