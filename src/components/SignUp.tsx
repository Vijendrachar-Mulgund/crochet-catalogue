// SignUp — account creation form, matching the app's sage theme.
import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router";
import logoMark from "../assets/logo-mark.svg";
import { useToast } from "./Toast";
import { signUpNewUser } from "../services/auth/sign-up";
import { insertData } from "../services/database/insert-data";

export function SignUp() {
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const get = (name: string) => (f.elements.namedItem(name) as HTMLInputElement).value;

    const firstName = get("firstName").trim();
    const lastName = get("lastName").trim();
    const email = get("email").trim();
    const phone = get("phone").trim();
    const password = get("password");
    const confirmPassword = get("confirmPassword");

    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      toast("Please fill in all fields", "err");
      return;
    }

    if (password.length <= 10) {
      toast("Password is too short. Please use a password with 10 or more characters", "err");
      return;
    }

    if (password !== confirmPassword) {
      toast("Passwords do not match", "err");
      return;
    }

    setSubmitting(true);
    // TODO: create the account in a data source / auth provider.

    try {
      const { data, error } = await signUpNewUser(email, password);

      if (error) {
        console.error(error);
      }

      const payload = {
        tableName: "users",
        data: {
          firstname: firstName,
          lastname: lastName,
          email,
          phone_number: phone,
        },
      };
      // Insert Data in to the DB when Signup is complete
      const isDataInserted: boolean = await insertData(payload);

      if (!isDataInserted || !data) {
        console.error("Failed to insert user data");
      }

      console.log("Sign up successful");
    } catch (err: any) {
      console.error("Sign up: Something went wrong: ", err);
    }

    toast("Account created", "ok");
    setSubmitting(false);
    navigate("/");
  }

  return (
    <div className="auth-overlay">
      <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
        <img className="login-logo" src={logoMark} alt="" />
        <h1>Charming Yarns</h1>
        <p className="login-sub">Create your account</p>

        <div className="field-row">
          <div className="field">
            <label>First name</label>
            <input type="text" name="firstName" autoComplete="given-name" placeholder="Jane" required />
          </div>
          <div className="field">
            <label>Last name</label>
            <input type="text" name="lastName" autoComplete="family-name" placeholder="Doe" required />
          </div>
        </div>

        <div className="field">
          <label>Email</label>
          <input type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
        </div>

        <div className="field">
          <label>Phone number</label>
          <input type="tel" name="phone" autoComplete="tel" placeholder="+91 98765 43210" required />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="Create a password"
              required
            />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter password"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
