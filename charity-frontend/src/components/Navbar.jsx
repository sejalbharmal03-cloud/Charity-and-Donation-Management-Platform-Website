
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link className="brand" to="/">
          <span className="brandmark">❤</span>
          <span>
            Care<span>Connect</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="main-nav">
          <Link to="/">Home</Link>
          <Link to="/campaigns">Campaigns</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>

          {/* Public Resources Page */}
          <Link to="/resources">Resources</Link>

          {user ? (
            <>
              <Link to="/admin">Dashboard</Link>

              <button
                type="button"
                className="linkbtn"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link className="navcta" to="/login">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}