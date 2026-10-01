import { useEffect, useRef, useState } from "react";
import { apiPost } from "../api.js";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

// Opened from the link in the verification email: /verify-email?token=...
function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  // The link works only once, so the request must not be sent twice
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) {
      return;
    }

    sent.current = true;

    const verify = async () => {
      try {
        const response = await apiPost("verify-email.php", {
          token,
        });

        const data = await response.json();

        setSuccess(data.success);
        setMessage(data.message);
      } catch (error) {
        console.error("Verify email error:", error);
        setMessage("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Email Verification</h1>

        {loading ? (
          <p>Verifying your email address...</p>
        ) : (
          <p className={success ? "notice notice-success" : "notice notice-error"}>
            {success ? (
              <CircleCheck size={18} />
            ) : (
              <TriangleAlert size={18} />
            )}

            {message}
          </p>
        )}

        {!loading && (
          <p className="auth-link">
            <Link to="/login">Go to Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
