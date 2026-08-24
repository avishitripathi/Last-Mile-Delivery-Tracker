import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Login() {

  const { login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [form, setForm] =
    useState({
      email: "",
      password: ""
    });

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  async function submit(e) {

    e.preventDefault();

    setError("");

    setBusy(true);

    try {

      await login(
        form.email,
        form.password
      );

      navigate(
        location.state?.from || "/",
        { replace: true }
      );

    } catch (err) {

      setError(err.message);

    } finally {

      setBusy(false);

    }
  }

  return (
    <div className="auth-screen">

      <div className="auth-panel">

        <div className="brand large">

          <div className="brand-mark">
            LM
          </div>

          <div>

            <strong>
              LAST-MILE
            </strong>

            <span>
              delivery console
            </span>

          </div>

        </div>

        <div className="eyebrow">
          SECURE ACCESS
        </div>

        <h1>
          Welcome back.
        </h1>

        <p className="lead">
          Sign in to manage deliveries,
          agents and live order status.
        </p>

        <form
          onSubmit={submit}
          className="form"
        >

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <label>
            Email

            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
              placeholder="you@example.com"
            />

          </label>

          <label>
            Password

            <input
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
              placeholder="••••••••"
            />

          </label>

          <button
            className="button full"
            disabled={busy}
          >
            {busy
              ? "Signing in…"
              : "Sign in →"}
          </button>

        </form>

        <p className="auth-foot">

          New customer?{" "}

          <Link to="/register">
            Create an account
          </Link>

        </p>

        <div className="demo-hint">
          Demo: admin@lastmile.test /
          Admin@123
        </div>

      </div>

      <div className="auth-art">

        <div className="route-line" />

        <div className="art-copy">

          <span>
            LOCAL DELIVERY NETWORK
          </span>

          <strong>
            Move every parcel
            <br />
            with certainty.
          </strong>

        </div>

      </div>

    </div>
  );
}