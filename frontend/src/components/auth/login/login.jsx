import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import { FaEye, FaEyeSlash, FaSignInAlt } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";
import { useState } from "react";
import api from "../../api/api";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userName", data.user.username);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error", err);
      setError(err?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" role="main">
        <Link to="/" className="back-button">
          <IoIosArrowBack size={18} /> Back
        </Link>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-head">
            <FaSignInAlt className="login-icon" />
            <h2>Sign in to your account</h2>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

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
              autoComplete="current-password"
              placeholder="Your password"
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

          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot" className="forgot-link">Forgot?</Link>
          </div>

          <button className="submit" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="register-link">
            Don’t have an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};
