
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public pages
import Home from "./pages/public/Home";
import Campaigns from "./pages/public/Campaigns";
import Details from "./pages/public/Details";
import { About, Contact } from "./pages/public/Static";
import ResourcesPage from "./pages/public/ResourcesPage";

// Authentication pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import CrudPage from "./pages/admin/CrudPage";
import Reports from "./pages/admin/Reports";
import Messages from "./pages/admin/Messages";
import Settings from "./pages/admin/Settings";
import Resources from "./pages/admin/Resources";

function Guard({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<Details />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <Guard>
                <AdminLayout />
              </Guard>
            }
          >
            <Route index element={<Dashboard />} />

            <Route
              path="campaigns"
              element={<CrudPage type="campaigns" />}
            />

            <Route
              path="donations"
              element={<CrudPage type="donations" />}
            />

            <Route
              path="volunteers"
              element={<CrudPage type="volunteers" />}
            />

            <Route
              path="sponsors"
              element={<CrudPage type="sponsors" />}
            />

            <Route
              path="users"
              element={<CrudPage type="users" />}
            />

            <Route path="messages" element={<Messages />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="resources" element={<Resources />} />
          </Route>

          {/* Invalid URL */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;