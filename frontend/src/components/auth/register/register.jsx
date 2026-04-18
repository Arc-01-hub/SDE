import { useState } from "react";
import { FaEye, FaEyeSlash, FaRegIdCard } from "react-icons/fa";
import "./register.css";
import { Link, useNavigate } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import api from "../../api/api";

export const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    if (!username.trim()) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (!email.trim()) return "Email is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        username: username.trim(),
        email: email.trim(),
        password,
      });
      const data = response.data;
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userName", data.user.username);
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error", err);
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card" role="main">
        <Link to="/" className="back-button">
          <IoIosArrowBack size={18} /> Back
        </Link>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <div className="register-head">
            <FaRegIdCard className="register-icon" />
            <h2>Create your account</h2>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              tabIndex={0}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>

          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-row">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm your password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirm((s) => !s)}
              aria-pressed={showConfirm}
              tabIndex={0}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>

          <button className="submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>

          <p className="login-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
