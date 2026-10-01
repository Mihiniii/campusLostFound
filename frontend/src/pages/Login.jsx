import { useState } from "react";
import { apiPost, openDevLink } from "../api.js";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Email not verified yet: offer to send the link again
  const handleNeedsVerification = async () => {
    const resend = window.confirm(
      "Please verify your email address before logging in.\n\n" +
        "Click OK to send the verification link again."
    );

    if (!resend) {
      return;
    }

    const response = await apiPost("resend-verification.php", {
      email,
    });

    const data = await response.json();

    alert(data.message);

    openDevLink(data, navigate);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await apiPost("login.php", {
      email,
      password,
    });

    const data = await response.json();

    if (data.needs_verification) {
      await handleNeedsVerification();
      return;
    }

    alert(data.message);

    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    }
  } catch (error) {
    console.error(error);
    alert("Could not connect to server.");
  }
};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Login to your Campus Lost & Found account.</p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        <p className="auth-link">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>

        <p className="auth-link">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
