// Login — email + password sign-in form, matching the app's sage theme.
import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router";
import logoMark from "../assets/logo-mark.svg";
import { useToast } from "./Toast";

export function Login() {
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const email = (f.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (f.elements.namedItem("password") as HTMLInputElement).value;

    if (!email || !password) {
      toast("Please fill in all fields", "err");
      return;
    }

    setSubmitting(true);
    // TODO: authenticate against a data source / auth provider.
    void { email, password };
    toast("Signed in", "ok");
    setSubmitting(false);
    navigate("/");
  }

  return (
    <div className="auth-overlay">
      <form className="auth-card" onSubmit={handleSubmit}>
        <img className="login-logo" src={logoMark} alt="" />
        <h1>Charming Yarns</h1>
        <p className="login-sub">Sign in to manage your catalogue</p>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%" }}
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
}
