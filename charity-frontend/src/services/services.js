import api from "./api";

export const auth = {
  login: (d) => api.post("/auth/login", d),
  register: (d) => api.post("/auth/register", d),
  me: () => api.get("/users/me"),
};

export const campaigns = {
  all: () => api.get("/campaigns"),

  adminAll: () => api.get("/campaigns/admin/all"),

  one: (id) => api.get(`/campaigns/${id}`),

  create: (d) => api.post("/campaigns", d),

  update: (id, d) => api.put(`/campaigns/${id}`, d),

  remove: (id) => api.delete(`/campaigns/${id}`),
};

export const donations = {
  create: (d) => api.post("/donations", d),

  mine: () => api.get("/donations/mine"),

  all: () => api.get("/donations/admin/all"),

  stats: () => api.get("/donations/admin/stats"),

  trend: () => api.get("/donations/trend"),

  updateStatus: (id, status) =>
    api.put(`/donations/admin/${id}/status`, { status }),

  remove: (id) => api.delete(`/donations/admin/${id}`),
};

export const volunteers = {
  create: (d) => api.post("/volunteers", d),

  all: () => api.get("/volunteers/admin/all"),

  update: (id, d) => api.put(`/volunteers/${id}`, d),

  remove: (id) => api.delete(`/volunteers/${id}`),
};

export const sponsors = {
  create: (d) => api.post("/sponsors", d),

  all: () => api.get("/sponsors/admin/all"),

  update: (id, d) => api.put(`/sponsors/${id}`, d),

  remove: (id) => api.delete(`/sponsors/${id}`),
};

export const users = {
  // Current user profile
  me: () => api.get("/users/me"),

  // Update current user profile
  updateProfile: (data) => api.put("/users/me", data),

  // Change current user's password
  changePassword: (data) =>
    api.put("/users/change-password", data),

  // Admin user management
  all: () => api.get("/users/admin/all"),

  overview: () => api.get("/users/admin/overview"),

  remove: (id) => api.delete(`/users/admin/${id}`),
};

export const reports = {
  fundraising: (params = {}) =>
    api.get("/reports/fundraising", { params }),

  topDonors: (params = {}) =>
    api.get("/reports/top-donors", { params }),

  donations: (params = {}) =>
    api.get("/reports/donations", { params }),

  projects: (params = {}) =>
    api.get("/reports/projects", { params }),

  volunteers: (params = {}) =>
    api.get("/reports/volunteers", { params }),

  sponsors: (params = {}) =>
    api.get("/reports/sponsors", { params }),
};

export const messages = {
  create: (d) => api.post("/messages", d),

  all: () => api.get("/messages/admin/all"),

  read: (id) => api.put(`/messages/${id}/read`),

  remove: (id) => api.delete(`/messages/${id}`),
};

export const resources = {
  publicList: (type) =>
    api.get(`/resources/${type}`),

  adminList: (type) =>
    api.get(`/resources/admin/${type}`),

  create: (type, data) =>
    api.post(`/resources/admin/${type}`, data),

  update: (type, id, data) =>
    api.put(`/resources/admin/${type}/${id}`, data),

  remove: (type, id) =>
    api.delete(`/resources/admin/${type}/${id}`),
};