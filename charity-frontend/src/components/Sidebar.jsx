
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const mainLinks = [
    ["/admin", "Dashboard", "▦"],
    ["/admin/donations", "Donation Management", "▤"],
    ["/admin/campaigns", "Project Tracking", "◇"],
    ["/admin/volunteers", "Volunteers", "♙"],
    ["/admin/sponsors", "Sponsors", "♡"],
  ];

  const analyticsLinks = [
    ["/admin/reports", "Fundraising Reports", "▥"],
  ];

  const controlLinks = [
    ["/admin/messages", "Messages", "✉"],
    ["/admin/users", "Users", "♟"],
    ["/admin/settings", "Settings", "⚙"],
    ["/admin/resources", "Documents & Gallery", "▤"],
  ];

  const renderLinks = (links) =>
    links.map(([to, label, icon]) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/admin"}
        className={({ isActive }) =>
          `sidelink ${isActive ? "active" : ""}`
        }
      >
        <b>{icon}</b>
        <span>{label}</span>
      </NavLink>
    ));

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebrand">
        <span className="sidebrand-icon">♡</span>
        <strong>CareConnect</strong>
      </div>

      <div className="sidebar-group">
        <div className="sidetitle">MAIN</div>
        {renderLinks(mainLinks)}
      </div>

      <div className="sidebar-group">
        <div className="sidetitle">ANALYTICS</div>
        {renderLinks(analyticsLinks)}
      </div>

      <div className="sidebar-group">
        <div className="sidetitle">CONTROL</div>
        {renderLinks(controlLinks)}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-logout"
        >
          ↪ Logout
        </button>
      </div>
    </aside>
  );
}
