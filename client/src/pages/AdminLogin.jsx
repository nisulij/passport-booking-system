import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      alert("Please enter admin email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://passport-booking-app.onrender.com/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      localStorage.setItem(
        "adminToken",
        data.token
      );

      localStorage.setItem(
        "adminEmail",
        form.email.trim()
      );

      navigate("/dashboard");

    } catch (err) {
      alert(
        err.message || "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      login();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

        .admin-login-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #e8e5e0;
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 10px 35px rgba(0,0,0,0.06);
        }

        .admin-login-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: #1e3a5f;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 20px;
        }

        .admin-login-title {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          font-weight: 400;
          color: #1e293b;
          margin-bottom: 6px;
        }

        .admin-login-sub {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 28px;
        }

        .admin-field {
          margin-bottom: 18px;
        }

        .admin-field label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          margin-bottom: 7px;
        }

        .admin-field input {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1e293b;
          outline: none;
          transition: all .2s ease;
        }

        .admin-field input:focus {
          border-color: #1e3a5f;
          box-shadow: 0 0 0 3px rgba(30,58,95,0.08);
        }

        .admin-login-btn {
          width: 100%;
          padding: 14px;
          background: #1e3a5f;
          color: #ffffff;
          border: none;
          border-radius: 11px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all .2s ease;
          margin-top: 6px;
        }

        .admin-login-btn:hover:not(:disabled) {
          background: #162d4d;
          transform: translateY(-1px);
        }

        .admin-login-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .admin-back-btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
        }

        .admin-back-btn:hover {
          background: #f8fafc;
        }

        .admin-security-note {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          color: #94a3b8;
          font-size: 11px;
        }
      `}</style>

      <div className="admin-login-card">
        <div className="admin-login-icon">
          🛡
        </div>

        <h1 className="admin-login-title">
          Admin Login
        </h1>

        <p className="admin-login-sub">
          Enter your administrator credentials to continue.
        </p>

        <div className="admin-field">
          <label>Admin Email</label>

          <input
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            onKeyDown={handleKeyDown}
            autoComplete="username"
          />
        </div>

        <div className="admin-field">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>

        <button
          className="admin-login-btn"
          onClick={login}
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Login to Dashboard"}
        </button>

        <button
          className="admin-back-btn"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

        <div className="admin-security-note">
          🔒 Authorized administrators only
        </div>
      </div>
    </div>
  );
}