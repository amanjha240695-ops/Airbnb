import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import Button from "../../components/common/Button";

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithOtp, registerWithOtp } = useAuth();
  const notification = useNotification();

  const email = location.state?.email || "";
  const name = location.state?.name || "";
  const mode = location.state?.mode || "login"; // "login" | "register"
  const from = location.state?.from || null; // Destination location state

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.trim().length !== 4) {
      notification?.showNotification?.("Please enter the 4-digit OTP", "error");
      return;
    }

    try {
      setLoading(true);

      if (mode === "register") {
        await registerWithOtp(name, email, otp.trim());
        notification?.showNotification?.("Registration complete! Welcome to Airbnb.", "success");
      } else {
        await loginWithOtp(email, otp.trim());
        notification?.showNotification?.("Logged in successfully", "success");
      }

      // Check if user came from a protected or booking page
      if (from) {
        if (typeof from === "object" && from.pathname) {
          // Carry over pathname, search query, and state (dates, guests, price)
          navigate(`${from.pathname}${from.search || ""}`, {
            state: from.state,
            replace: true,
          });
          return;
        } else if (typeof from === "string") {
          navigate(from, { replace: true });
          return;
        }
      }

      // Fallback default: Home page
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Invalid or expired OTP";
      notification?.showNotification?.(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "440px", margin: "60px auto", padding: "32px", border: "1px solid #ddd", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>
        {mode === "register" ? "Confirm your email" : "Enter verification code"}
      </h2>
      <p style={{ color: "#717171", fontSize: "14px", marginBottom: "24px" }}>
        We sent a 4-digit verification code to <strong style={{ color: "#222" }}>{email}</strong>. Check your inbox and spam folder.
      </p>

      <form onSubmit={handleVerify}>
        <div style={{ marginBottom: "24px" }}>
          <input
            type="text"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            autoFocus
            style={{
              width: "100%",
              padding: "14px",
              textAlign: "center",
              fontSize: "28px",
              letterSpacing: "12px",
              fontWeight: "700",
              borderRadius: "8px",
              border: "1px solid #b0b0b0",
              boxSizing: "border-box"
            }}
          />
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          {loading ? "Verifying..." : mode === "register" ? "Complete Registration" : "Confirm & Log in"}
        </Button>
      </form>
    </div>
  );
}