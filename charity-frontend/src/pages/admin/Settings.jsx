import { useEffect, useState } from "react";
import { users } from "../../services/services";
import { useAuth } from "../../context/AuthContext";

const defaultSettings = {
  adminName: "",
  adminEmail: "",
  phone: "",
  websiteName: "CareConnect",
  contactEmail: "",
  contactPhone: "",
  emailNotifications: true,
  donationNotifications: true,
  volunteerNotifications: true,
};

const loadSavedSettings = () => {
  try {
    const saved = localStorage.getItem("careconnectSettings");
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export default function Settings({ onLogout }) {
  const { logout } = useAuth();

  const [settings, setSettings] = useState(loadSavedSettings);
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await users.me();
        const profile = response.data.user;

        setSettings((previous) => ({
          ...previous,
          adminName: profile.name || "",
          adminEmail: profile.email || "",
          phone: profile.phone || "",
        }));
      } catch (err) {
        setError(true);
        setMessage(
          err.response?.data?.message ||
            "Profile load zala nahi. Login ani backend check kar."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const saveBasicSettings = async (event) => {
    event.preventDefault();
    setMessage("");
    setError(false);
    setSavingProfile(true);

    try {
      const response = await users.updateProfile({
        name: settings.adminName.trim(),
        email: settings.adminEmail.trim(),
        phone: settings.phone.trim(),
      });

      const updatedUser = response.data.user;

      setSettings((previous) => ({
        ...previous,
        adminName: updatedUser.name,
        adminEmail: updatedUser.email,
        phone: updatedUser.phone || "",
      }));

      // Keep the saved login user details in sync.
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setMessage("Admin profile successfully update zala!");
    } catch (err) {
      setError(true);
      setMessage(
        err.response?.data?.message ||
          "Profile save zala nahi. Backend ani API check kar."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const saveWebsiteSettings = (event) => {
    event.preventDefault();

    try {
      localStorage.setItem(
        "careconnectSettings",
        JSON.stringify({
          websiteName: settings.websiteName,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          emailNotifications: settings.emailNotifications,
          donationNotifications: settings.donationNotifications,
          volunteerNotifications: settings.volunteerNotifications,
        })
      );

      setError(false);
      setMessage(
        "Website preferences ya browser madhye save zhalya. Database madhye ajun save hot nahit."
      );
    } catch {
      setError(true);
      setMessage("Settings save zhalya nahit.");
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError(false);

    if (!password.current || !password.next || !password.confirm) {
      setError(true);
      setMessage("Sarva password fields bhar.");
      return;
    }

    if (password.next.length < 8) {
      setError(true);
      setMessage("New password madhye kiman 8 characters pahijet.");
      return;
    }

    if (password.next !== password.confirm) {
      setError(true);
      setMessage("New password ani confirm password match hot nahit.");
      return;
    }

    if (password.current === password.next) {
      setError(true);
      setMessage("New password ha current password peksha vegla thev.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await users.changePassword({
        currentPassword: password.current,
        newPassword: password.next,
      });

      setPassword({
        current: "",
        next: "",
        confirm: "",
      });

      setMessage(
        response.data.message || "Password successfully change zala!"
      );
    } catch (err) {
      setError(true);
      setMessage(
        err.response?.data?.message ||
          "Password change zala nahi. Login ani backend API check kar."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
    } else {
      logout();
      window.location.href = "/login";
    }
  };

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 13px",
    marginTop: 6,
    border: "1px solid #d9dfd5",
    borderRadius: 9,
    background: "#fff",
    color: "#26382d",
  };

  const cardStyle = {
    background: "#fff",
    border: "1px solid #e5e9e1",
    borderRadius: 14,
    padding: 22,
    marginBottom: 20,
  };

  const buttonStyle = {
    padding: "11px 18px",
    border: "none",
    borderRadius: 9,
    background: "#287a48",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };

  const Field = ({ label, value, onChange, type = "text" }) => (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        style={fieldStyle}
        required
      />
    </label>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "13px 0",
        borderBottom: "1px solid #edf0ea",
      }}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "10px 0" }}>
      <div className="pagebar">
        <div>
          <span className="eyebrow">ADMIN PANEL</span>
          <h1>Settings</h1>
          <p style={{ color: "#68756a" }}>
            Manage your profile and website preferences.
          </p>
        </div>
      </div>

      {message && (
        <div
          className="alert"
          role="status"
          style={{
            marginBottom: 18,
            color: error ? "#b42318" : "#216e39",
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <p>Profile load hot aahe...</p>
      ) : (
        <>
          <form onSubmit={saveBasicSettings}>
            <section style={cardStyle}>
              <h2>Admin Profile</h2>
              <p style={{ color: "#68756a" }}>
                Your administrator account information.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                <Field
                  label="Admin Name"
                  value={settings.adminName}
                  onChange={(e) =>
                    updateSetting("adminName", e.target.value)
                  }
                />

                <Field
                  label="Admin Email"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) =>
                    updateSetting("adminEmail", e.target.value)
                  }
                />

                <Field
                  label="Phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => updateSetting("phone", e.target.value)}
                />
              </div>

              <button
                type="submit"
                style={buttonStyle}
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Admin Profile"}
              </button>
            </section>
          </form>

          <form onSubmit={saveWebsiteSettings}>
            <section style={cardStyle}>
              <h2>Website & Contact Information</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                }}
              >
                <Field
                  label="Website Name"
                  value={settings.websiteName}
                  onChange={(e) =>
                    updateSetting("websiteName", e.target.value)
                  }
                />

                <Field
                  label="Contact Email"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) =>
                    updateSetting("contactEmail", e.target.value)
                  }
                />

                <Field
                  label="Contact Phone"
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) =>
                    updateSetting("contactPhone", e.target.value)
                  }
                />
              </div>

              <button type="submit" style={buttonStyle}>
                Save Website Settings
              </button>
            </section>
          </form>

          <form onSubmit={changePassword}>
            <section style={cardStyle}>
              <h2>Change Password</h2>
              <p style={{ color: "#68756a" }}>
                Enter your current password and choose a new one.
              </p>

              <Field
                label="Current Password"
                type="password"
                value={password.current}
                onChange={(e) =>
                  setPassword((previous) => ({
                    ...previous,
                    current: e.target.value,
                  }))
                }
              />

              <Field
                label="New Password"
                type="password"
                value={password.next}
                onChange={(e) =>
                  setPassword((previous) => ({
                    ...previous,
                    next: e.target.value,
                  }))
                }
              />

              <Field
                label="Confirm New Password"
                type="password"
                value={password.confirm}
                onChange={(e) =>
                  setPassword((previous) => ({
                    ...previous,
                    confirm: e.target.value,
                  }))
                }
              />

              <button
                type="submit"
                style={buttonStyle}
                disabled={changingPassword}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </section>
          </form>

          <section style={cardStyle}>
            <h2>Notification Settings</h2>

            <Toggle
              label="Email Notifications"
              checked={settings.emailNotifications}
              onChange={(value) =>
                updateSetting("emailNotifications", value)
              }
            />

            <Toggle
              label="Donation Notifications"
              checked={settings.donationNotifications}
              onChange={(value) =>
                updateSetting("donationNotifications", value)
              }
            />

            <Toggle
              label="Volunteer Notifications"
              checked={settings.volunteerNotifications}
              onChange={(value) =>
                updateSetting("volunteerNotifications", value)
              }
            />

            <p style={{ color: "#68756a", fontSize: 13 }}>
              Save these preferences using the Save Website Settings button.
              They are stored in this browser, not in the database.
            </p>
          </section>

          <section style={cardStyle}>
            <h2>Logout</h2>
            <p style={{ color: "#68756a" }}>
              Sign out of your administrator account.
            </p>

            <button
              type="button"
              style={{
                ...buttonStyle,
                background: "#b42318",
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </section>
        </>
      )}
    </div>
  );
}
