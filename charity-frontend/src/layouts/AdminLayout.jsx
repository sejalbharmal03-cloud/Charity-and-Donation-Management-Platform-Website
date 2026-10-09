import { Outlet, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();

  const userName = user?.name || "Admin";
  const userRole = user?.role || "user";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="admin-shell">
      <Sidebar />

      <section className="admin-main">
        <header className="admin-top">
          <div className="admin-heading">
            <small>CARECONNECT ADMIN</small>

            <h2>
              Management Dashboard
            </h2>
          </div>

          <div className="admin-user">
            <div className="admin-user-avatar">
              {userInitial}
            </div>

            <div className="admin-user-info">
              <strong>
                {userName}
              </strong>

              <small>
                {userRole}
              </small>
            </div>

            <Link
              to="/"
              className="admin-home-link"
            >
              View site
            </Link>

            <button
              type="button"
              className="admin-logout"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}