import { useState } from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Register() {

  const { register } = useAuth();

  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      phone: "",
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

      await register(form);

      navigate(
        "/login",
        {
          replace: true,
          state: {
            registered: true
          }
        }
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
          CUSTOMER ACCOUNT
        </div>

        <h1>
          Create account.
        </h1>

        <p className="lead">
          Book deliveries and follow every
          handoff from pickup to doorstep.
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
            Name

            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
            />

          </label>

          <label>
            Email

            <input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
            />

          </label>

          <label>
            Phone

            <input
              required
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value
                })
              }
            />

          </label>

          <label>
            Password

            <input
              required
              minLength="6"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value
                })
              }
            />

          </label>

          <button
            className="button full"
            disabled={busy}
          >
            {busy
              ? "Creating…"
              : "Create account →"}
          </button>

        </form>

        <p className="auth-foot">

          Already registered?{" "}

          <Link to="/login">
            Sign in
          </Link>

        </p>

      </div>

      <div className="auth-art">

        <div className="art-copy">

          <span>
            LAST-MILE / CUSTOMER
          </span>

          <strong>
            From warehouse
            <br />
            to welcome mat.
          </strong>

        </div>

      </div>

    </div>
  );
}