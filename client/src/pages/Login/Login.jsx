import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { requestOtpApi } from "../../services/authApi";
import { useNotification } from "../../context/NotificationContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const notification = useNotification();

  // Grab the intended destination saved by ProtectedRoute or Reserve button
  const from = location.state?.from || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      notification?.showNotification?.("Please enter your email", "error");
      return;
    }

    try {
      setLoading(true);
      await requestOtpApi(email.trim());

      notification?.showNotification?.("OTP sent to your email", "success");
      
      // Forward `from` state so VerifyOTP knows where to return after verification
      navigate("/verify-otp", {
        state: { email: email.trim(), mode: "login", from },
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to send OTP";

      // If user is not found, automatically redirect to Register page and keep `from`
      if (
        message.toLowerCase().includes("register") ||
        message.toLowerCase().includes("no account found")
      ) {
        notification?.showNotification?.(
          "Account not found. Let's get you registered!",
          "info"
        );
        navigate(`/register?email=${encodeURIComponent(email.trim())}`, {
          state: { from },
        });
      } else {
        notification?.showNotification?.(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Log in to Airbnb</h1>
        <p className="login-subtitle">
          Enter your email and we'll send a 4-digit verification code.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            disabled={loading}
          />

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            {loading ? "Checking..." : "Continue with Email"}
          </Button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" state={{ from }} className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}