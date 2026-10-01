import { useState } from "react";
import { apiFetch, openDevLink } from "../api.js";
import { useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validatePassword(password)) {
    alert(
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number."
    );
    return;
  }

  try {
    const response = await apiFetch(
      "register.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    alert(data.message);

    if (data.success) {
      setName("");
      setEmail("");
      setPassword("");

      // The account works after the email address is verified
      if (!openDevLink(data, navigate)) {
        navigate("/login");
      }
    }
  } catch (error) {
    console.error(error);
    alert("Could not connect to server.");
  }
};

const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return minLength && hasUppercase && hasLowercase && hasNumber;
};
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p>Join your campus Lost & Found community.</p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>University Email</label>

          <input
            type="email"
            placeholder="Enter your university email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            />

          <button type="submit">Create Account</button>
        </form>

        <p className="auth-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
}

export default Register;