import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(form);

      navigate(
        data.user?.role === "admin"
          ? "/admin"
          : "/"
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authpage">
      <form
        className="authcard"
        onSubmit={submit}
      >
        <Link
          to="/"
          className="authlogo"
          aria-label="CareConnect home"
        >
          ❤
        </Link>

        <div className="authheading">
          <span className="eyebrow">WELCOME BACK</span>

          <h1>Sign in to CareConnect.</h1>

          <p>
            Sign in to continue supporting meaningful
            causes and making a difference.
          </p>
        </div>

        {error && (
          <div className="alert">
            {error}
          </div>
        )}

        <label>
          Email
          <input
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password: event.target.value,
              })
            }
          />
        </label>

        <button
          type="submit"
          className="primary full"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <div className="authdivider">
          <span>OR</span>
        </div>

        <span className="center">
          New here?{" "}
          <Link to="/register">
            Create an account
          </Link>
        </span>

        <Link
          to="/"
          className="backhome"
        >
          ← Back to home
        </Link>
      </form>
    </div>
  );
}