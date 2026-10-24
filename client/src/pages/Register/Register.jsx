import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { requestRegisterOtpApi } from "../../services/authApi";
import { useNotification } from "../../context/NotificationContext";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import "./Register.css";

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notification = useNotification();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      notification?.showNotification?.("Please enter your legal name", "error");
      return;
    }

    if (!email.trim()) {
      notification?.showNotification?.("Please enter a valid email", "error");
      return;
    }

    try {
      setLoading(true);
      await requestRegisterOtpApi(email.trim());

      notification?.showNotification?.("Verification code sent to your email", "success");
      navigate("/verify-otp", {
        state: {
          email: email.trim(),
          name: name.trim(),
          mode: "register",
        },
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to initiate registration";
      notification?.showNotification?.(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1 className="register-title">Finish signing up</h1>
        <p className="register-subtitle">
          Looks like you're new here. Enter your legal details to create your account.
        </p>

        <form onSubmit={handleSubmit} className="register-form">
          <Input
            label="Full Legal Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            disabled={loading}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            disabled={loading}
          />

          <p className="register-disclaimer">
            By selecting <strong>Agree and continue</strong>, you agree to Airbnb Clone's Terms of Service and Privacy Policy.
          </p>

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            {loading ? "Sending Code..." : "Agree and continue"}
          </Button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}