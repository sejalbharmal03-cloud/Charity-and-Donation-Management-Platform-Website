import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <div className="authpage">
      <form
        className="authcard register-card"
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
          <span className="eyebrow">JOIN CARECONNECT</span>

          <h1>Create your account.</h1>

          <p>
            Join the CareConnect community and start
            supporting meaningful causes.
          </p>
        </div>

        {error && (
          <div className="alert">
            {error}
          </div>
        )}

        <label>
          Full name
          <input
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
          />
        </label>

        <label>
          Email
          <input
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
          />
        </label>

        <label>
          Phone
          <input
            type="tel"
            placeholder="Enter your phone number"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={6}
            required
            value={form.password}
            onChange={(event) =>
              updateField("password", event.target.value)
            }
          />
        </label>

        <button
          type="submit"
          className="primary full"
          disabled={loading}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <div className="authdivider">
          <span>OR</span>
        </div>

        <span className="center">
          Already registered?{" "}
          <Link to="/login">
            Sign in
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