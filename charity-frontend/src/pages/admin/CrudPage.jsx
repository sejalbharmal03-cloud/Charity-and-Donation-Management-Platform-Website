import { useEffect, useMemo, useState } from "react";

import {
  campaigns,
  donations,
  volunteers,
  sponsors,
  users,
  messages
} from "../../services/services";

const cfg = {
  campaigns: {
    title: "Project Tracking",
    fn: campaigns.adminAll,
    key: "projects",
    cols: ["title", "category", "goal", "raised", "progress"]
  },

  donations: {
    title: "Donations",
    fn: donations.all,
    key: "donations",
    cols: ["id", "amount", "payment_method", "status", "created_at"]
  },

  volunteers: {
    title: "Volunteers",
    fn: volunteers.all,
    key: "volunteers",
    cols: ["name", "email", "phone", "interest", "status"]
  },

  sponsors: {
    title: "Sponsors",
    fn: sponsors.all,
    key: "sponsors",
    cols: ["name", "email", "phone", "company", "status"]
  },

  
users: {
  title: "Users Management",
  fn: users.all,
  key: "users",
  cols: ["id", "name", "email", "phone", "role", "created_at", "status"],
},

  messages: {
    title: "Messages",
    fn: messages.all,
    key: "messages",
    cols: ["name", "email", "subject", "read", "created_at"]
  }
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function statusLabel(value) {
  const status = normalizeStatus(value);

  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  if (status === "inactive") return "Inactive";
  if (status === "failed") return "Failed";

  return value || "—";
}

export default function CrudPage({ type }) {
  const c = cfg[type];

  const [data, setData] = useState([]);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedDonation, setSelectedDonation] = useState(null);

  const [projectModal, setProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [projectForm, setProjectForm] = useState({
    title: "",
    category: "",
    description: "",
    goal: "",
    image_url: "",
    deadline: "",
    status: "active"
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isDonations = type === "donations";
  const isCampaigns = type === "campaigns";

const isVolunteers = type === "volunteers";


const isSponsors = type === "sponsors";
const isUsers = type === "users";
const [userRoleFilter, setUserRoleFilter] = useState("all");

const [sponsorModal, setSponsorModal] = useState(false);
const [editingSponsor, setEditingSponsor] = useState(null);
const [sponsorProjects, setSponsorProjects] = useState([]);

const emptySponsorForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  contribution: "",
  website: "",
  sponsored_project: "",
  sponsorship_date: "",
  status: "active"
};

const [sponsorForm, setSponsorForm] = useState(emptySponsorForm);

const filteredSponsors = useMemo(() => {
  if (!isSponsors) return [];

  const searchText = search.trim().toLowerCase();

  return data.filter((sponsor) => {
    const matchesSearch =
      !searchText ||
      [
        sponsor.name,
        sponsor.company,
        sponsor.email,
        sponsor.phone,
        sponsor.sponsored_project
      ].some((value) =>
        String(value || "").toLowerCase().includes(searchText)
      );

    const matchesStatus =
      statusFilter === "all" ||
      normalizeStatus(sponsor.status) === statusFilter;

    return matchesSearch && matchesStatus;
  });
}, [data, search, statusFilter, isSponsors]);

const totalSponsorship = data.reduce(
  (sum, sponsor) => sum + Number(sponsor.contribution || 0),
  0
);

const openAddSponsor = () => {
  setErr("");
  setEditingSponsor(null);
  setSponsorForm({ ...emptySponsorForm });
  setSponsorModal(true);
};

const openEditSponsor = (sponsor) => {
  setErr("");
  setEditingSponsor(sponsor);

  setSponsorForm({
    name: sponsor.name || "",
    company: sponsor.company || "",
    email: sponsor.email || "",
    phone: sponsor.phone || "",
    contribution: sponsor.contribution ?? "",
    website: sponsor.website || "",
    sponsored_project: sponsor.sponsored_project || "",
    sponsorship_date: formatDateInput(sponsor.sponsorship_date),
    status: normalizeStatus(sponsor.status) || "active"
  });

  setSponsorModal(true);
};

const handleSponsorChange = (event) => {
  const { name, value } = event.target;

  setSponsorForm((previous) => ({
    ...previous,
    [name]: value
  }));
};

const saveSponsor = async (event) => {
  event.preventDefault();

  if (!sponsorForm.name.trim() || !sponsorForm.email.trim()) {
    setErr("Sponsor name and email are required.");
    return;
  }

  if (
    sponsorForm.contribution === "" ||
    Number(sponsorForm.contribution) < 0
  ) {
    setErr("Please enter a valid sponsorship amount.");
    return;
  }

  try {
    setActionLoading(true);
    setErr("");

    const payload = {
      name: sponsorForm.name.trim(),
      company: sponsorForm.company.trim() || null,
      email: sponsorForm.email.trim(),
      phone: sponsorForm.phone.trim() || null,
      contribution: Number(sponsorForm.contribution),
      website: sponsorForm.website.trim() || null,
      sponsored_project: sponsorForm.sponsored_project || null,
      sponsorship_date: sponsorForm.sponsorship_date || null,
      status: sponsorForm.status
    };

    if (editingSponsor) {
      await sponsors.update(editingSponsor.id, payload);
    } else {
      await sponsors.create(payload);
    }

    setSponsorModal(false);
    setEditingSponsor(null);
    setSponsorForm({ ...emptySponsorForm });

    await loadData();
  } catch (error) {
    setErr(
      error.response?.data?.message ||
        (editingSponsor
          ? "Unable to update sponsor."
          : "Unable to add sponsor.")
    );
  } finally {
    setActionLoading(false);
  }
};

const deleteSponsor = async (id) => {
  if (!window.confirm("Are you sure you want to delete this sponsor?")) {
    return;
  }

  try {
    setActionLoading(true);
    setErr("");

    await sponsors.remove(id);
    await loadData();
  } catch (error) {
    setErr(
      error.response?.data?.message ||
        "Unable to delete sponsor."
    );
  } finally {
    setActionLoading(false);
  }
};

const [volunteerModal, setVolunteerModal] = useState(false);

const [volunteerForm, setVolunteerForm] = useState({
  name: "",
  email: "",
  phone: "",
  interest: "",
  availability: ""
});

const filteredVolunteers = useMemo(() => {
  if (!isVolunteers) return [];

  const searchText = search.trim().toLowerCase();

  return data.filter((volunteer) => {
    const matchesSearch =
      !searchText ||
      [
        volunteer.name,
        volunteer.email,
        volunteer.phone,
        volunteer.interest
      ].some((value) =>
        String(value || "").toLowerCase().includes(searchText)
      );

    const matchesStatus =
      statusFilter === "all" ||
      normalizeStatus(volunteer.status) === statusFilter;

    return matchesSearch && matchesStatus;
  });
}, [data, search, statusFilter, isVolunteers]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");

      const response = await c.fn();

      setData(response.data?.[c.key] || []);
    } catch (error) {
      setErr(
        error.response?.data?.message ||
          "Unable to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const saveVolunteer = async (event) => {
  event.preventDefault();

  if (
    !volunteerForm.name.trim() ||
    !volunteerForm.email.trim() ||
    !volunteerForm.phone.trim()
  ) {
    setErr("Name, email and phone are required.");
    return;
  }

  try {
    setActionLoading(true);
    setErr("");

    await volunteers.create({
      name: volunteerForm.name.trim(),
      email: volunteerForm.email.trim(),
      phone: volunteerForm.phone.trim(),
      interest: volunteerForm.interest.trim(),
      availability: volunteerForm.availability
    });

    setVolunteerModal(false);
    setVolunteerForm({
      name: "",
      email: "",
      phone: "",
      interest: "",
      availability: ""
    });

    await loadData();
  } catch (error) {
    setErr(
      error.response?.data?.message ||
      "Unable to register volunteer."
    );
  } finally {
    setActionLoading(false);
  }
};

const updateVolunteerStatus = async (id, status) => {
  try {
    setActionLoading(true);
    setErr("");

    await volunteers.update(id, { status });
    await loadData();
  } catch (error) {
    setErr(
      error.response?.data?.message ||
      "Unable to update volunteer status."
    );
  } finally {
    setActionLoading(false);
  }
};

const deleteVolunteer = async (id) => {
  if (!window.confirm("Are you sure you want to delete this volunteer?")) {
    return;
  }

  try {
    setActionLoading(true);
    setErr("");

    await volunteers.remove(id);
    await loadData();
  } catch (error) {
    setErr(
      error.response?.data?.message ||
      "Unable to delete volunteer."
    );
  } finally {
    setActionLoading(false);
  }
};

  useEffect(() => {
    loadData();
  }, [type]);

  
useEffect(() => {
  if (!isSponsors) return;

  let cancelled = false;

  const loadSponsorProjects = async () => {
    try {
      const response = await campaigns.adminAll();

      if (!cancelled) {
        setSponsorProjects(response.data?.projects || []);
      }
    } catch {
      if (!cancelled) {
        setSponsorProjects([]);
      }
    }
  };

  loadSponsorProjects();

  return () => {
    cancelled = true;
  };
}, [isSponsors]);

  /*
   * ==========================================
   * PROJECT FILTERING
   * ==========================================
   */

  const filteredProjects = useMemo(() => {
    if (!isCampaigns) return data;

    const searchText = search.trim().toLowerCase();

    return data.filter((project) => {
      const matchesSearch =
        !searchText ||
        String(project.title || "")
          .toLowerCase()
          .includes(searchText) ||
        String(project.category || "")
          .toLowerCase()
          .includes(searchText) ||
        String(project.description || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(project.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter, isCampaigns]);

  /*
   * ==========================================
   * DONATION FILTERING
   * ==========================================
   */

  const filteredDonations = useMemo(() => {
    if (!isDonations) return data;

    const searchText = search.trim().toLowerCase();

    return data.filter((donation) => {
      const matchesSearch =
        !searchText ||
        String(donation.id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(donation.donor_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(donation.donor_email || "")
          .toLowerCase()
          .includes(searchText) ||
        String(donation.transaction_id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(donation.amount || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(donation.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter, isDonations]);

  /*
   * ==========================================
   * DONATION SUMMARY
   * ==========================================
   */

  const completedTotal = data
    .filter(
      (item) =>
        normalizeStatus(item.status) === "completed"
    )
    .reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

  const completedCount = data.filter(
    (item) =>
      normalizeStatus(item.status) === "completed"
  ).length;

  const pendingCount = data.filter(
    (item) =>
      normalizeStatus(item.status) === "pending"
  ).length;

  const failedCount = data.filter(
    (item) =>
      normalizeStatus(item.status) === "failed"
  ).length;

  /*
   * ==========================================
   * PROJECT SUMMARY
   * ==========================================
   */

  const activeProjectCount = data.filter(
    (project) =>
      normalizeStatus(project.status) === "active"
  ).length;

  const completedProjectCount = data.filter(
    (project) =>
      normalizeStatus(project.status) === "completed"
  ).length;

  const pendingProjectCount = data.filter(
    (project) =>
      normalizeStatus(project.status) === "pending"
  ).length;

  const totalProjectGoal = data.reduce(
    (sum, project) =>
      sum + Number(project.goal || 0),
    0
  );

  const totalProjectRaised = data.reduce(
    (sum, project) =>
      sum + Number(project.raised || 0),
    0
  );

  /*
   * ==========================================
   * DONATION ACTIONS
   * ==========================================
   */

  const updateDonationStatus = async (id, status) => {
    try {
      setActionLoading(true);
      setErr("");

      await donations.updateStatus(id, status);

      await loadData();

      if (selectedDonation?.id === id) {
        setSelectedDonation((previous) =>
          previous
            ? {
                ...previous,
                status
              }
            : null
        );
      }
    } catch (error) {
      setErr(
        error.response?.data?.message ||
          "Unable to update donation status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDonation = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this donation?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setErr("");

      await donations.remove(id);

      setSelectedDonation(null);

      await loadData();
    } catch (error) {
      setErr(
        error.response?.data?.message ||
          "Unable to delete donation"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ==========================================
   * PROJECT MODAL
   * ==========================================
   */

  const resetProjectForm = () => {
    setProjectForm({
      title: "",
      category: "",
      description: "",
      goal: "",
      image_url: "",
      deadline: "",
      status: "active"
    });
  };

  const openAddProject = () => {
    setErr("");
    setEditingProject(null);
    resetProjectForm();
    setProjectModal(true);
  };

  const openEditProject = (project) => {
    setErr("");
    setEditingProject(project);

    setProjectForm({
      title: project.title || "",
      category: project.category || "",
      description: project.description || "",
      goal: project.goal ?? "",
      image_url: project.image_url || "",
      deadline: formatDateInput(project.deadline),
      status: normalizeStatus(project.status) || "active"
    });

    setProjectModal(true);
  };

  const closeProjectModal = () => {
    if (actionLoading) return;

    setProjectModal(false);
    setEditingProject(null);
    resetProjectForm();
  };

  const handleProjectChange = (event) => {
    const { name, value } = event.target;

    setProjectForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const saveProject = async (event) => {
    event.preventDefault();

    if (!projectForm.title.trim()) {
      setErr("Project name is required.");
      return;
    }

    if (!projectForm.category.trim()) {
      setErr("Project category is required.");
      return;
    }

    if (!projectForm.description.trim()) {
      setErr("Project description is required.");
      return;
    }

    if (
      projectForm.goal === "" ||
      Number(projectForm.goal) <= 0
    ) {
      setErr("Target amount must be greater than 0.");
      return;
    }

    try {
      setActionLoading(true);
      setErr("");

      const payload = {
        title: projectForm.title.trim(),
        category: projectForm.category.trim(),
        description: projectForm.description.trim(),
        goal: Number(projectForm.goal),
        image_url:
          projectForm.image_url.trim() || null,
        deadline:
          projectForm.deadline || null,
        status:
          projectForm.status || "active"
      };

      if (editingProject) {
        await campaigns.update(
          editingProject.id,
          payload
        );
      } else {
        await campaigns.create(payload);
      }

      setProjectModal(false);
      setEditingProject(null);
      resetProjectForm();

      await loadData();
    } catch (error) {
      setErr(
        error.response?.data?.message ||
          (editingProject
            ? "Unable to update project"
            : "Unable to create project")
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProject = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setErr("");

      await campaigns.remove(id);

      await loadData();
    } catch (error) {
      setErr(
        error.response?.data?.message ||
          "Unable to delete project"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ==========================================
   * PROJECT TRACKING PAGE
   * ==========================================
   */

  if (isCampaigns) {
    return (
      <div>
        <div className="pagebar">
          <div>
            <span className="eyebrow">
              MANAGEMENT
            </span>

            <h1>Project Tracking</h1>

            <p
              style={{
                margin: "7px 0 0",
                opacity: 0.65,
                fontSize: "13px"
              }}
            >
              Manage projects, targets, deadlines and
              fundraising progress.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddProject}
            disabled={actionLoading}
            style={{
              border: "0",
              borderRadius: "10px",
              padding: "12px 18px",
              cursor: "pointer",
              fontWeight: "800",
              fontSize: "13px"
            }}
          >
            + Add Project
          </button>
        </div>

        {err && (
          <div className="alert">
            {err}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "20px"
          }}
        >
          <div className="dashboard-panel">
            <small>Total Projects</small>
            <h2>{data.length}</h2>
          </div>

          <div className="dashboard-panel">
            <small>Active</small>
            <h2>{activeProjectCount}</h2>
          </div>

          <div className="dashboard-panel">
            <small>Completed</small>
            <h2>{completedProjectCount}</h2>
          </div>

          <div className="dashboard-panel">
            <small>Total Raised</small>
            <h2>{formatAmount(totalProjectRaised)}</h2>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}
        >
          <input
            type="text"
            placeholder="Search project, category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              flex: 1,
              minWidth: "260px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="pending">
              Pending
            </option>
          </select>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Category</th>
                <th>Target</th>
                <th>Collected</th>
                <th>Progress</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.map((project) => {
                const raised =
                  Number(project.raised || 0);

                const goal =
                  Number(project.goal || 0);

                const progress =
                  Number(
                    project.progress ??
                      (goal > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (raised / goal) *
                                100
                            )
                          )
                        : 0)
                  );

                return (
                  <tr key={project.id}>
                    <td>
                      <strong>
                        {project.title}
                      </strong>

                      <br />

                      <small
                        style={{
                          display: "inline-block",
                          maxWidth: "260px",
                          marginTop: "4px",
                          opacity: 0.6
                        }}
                      >
                        {project.description ||
                          "—"}
                      </small>
                    </td>

                    <td>
                      {project.category || "—"}
                    </td>

                    <td>
                      {formatAmount(goal)}
                    </td>

                    <td>
                      <strong>
                        {formatAmount(raised)}
                      </strong>
                    </td>

                    <td
                      style={{
                        minWidth: "180px"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          marginBottom: "6px",
                          fontSize: "11px"
                        }}
                      >
                        <span>
                          {progress}%
                        </span>

                        <span>
                          {formatAmount(
                            raised
                          )}{" "}
                          /{" "}
                          {formatAmount(
                            goal
                          )}
                        </span>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background:
                            "#e9e9e9",
                          borderRadius:
                            "999px",
                          overflow:
                            "hidden"
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                progress
                              )
                            )}%`,
                            height: "100%",
                            borderRadius:
                              "999px",
                            transition:
                              "width 0.3s ease"
                          }}
                        />
                      </div>
                    </td>

                    <td>
                      {formatDate(
                        project.deadline
                      )}
                    </td>

                    <td>
                      <select
                        value={
                          normalizeStatus(
                            project.status
                          ) || "active"
                        }
                        disabled={actionLoading}
                        onChange={(e) =>
                          campaigns.update(
                            project.id,
                            {
                              title:
                                project.title,
                              category:
                                project.category,
                              description:
                                project.description,
                              goal:
                                Number(
                                  project.goal
                                ),
                              image_url:
                                project.image_url ||
                                null,
                              deadline:
                                project.deadline ||
                                null,
                              status:
                                e.target.value
                            }
                          )
                            .then(
                              () =>
                                loadData()
                            )
                            .catch(
                              (error) =>
                                setErr(
                                  error
                                    .response
                                    ?.data
                                    ?.message ||
                                    "Unable to update project status"
                                )
                            )
                        }
                      >
                        <option value="active">
                          Active
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="pending">
                          Pending
                        </option>
                      </select>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap"
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEditProject(
                              project
                            )
                          }
                          disabled={
                            actionLoading
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteProject(
                              project.id
                            )
                          }
                          disabled={
                            actionLoading
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filteredProjects.length &&
            !loading && (
              <div className="empty">
                No projects found.
              </div>
            )}

          {loading && (
            <div className="empty">
              Loading projects...
            </div>
          )}
        </div>

        {projectModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
              overflowY: "auto"
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "25px",
                width: "100%",
                maxWidth: "650px",
                maxHeight: "90vh",
                overflowY: "auto"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "20px"
                }}
              >
                <div>
                  <span className="eyebrow">
                    PROJECT
                  </span>

                  <h2
                    style={{
                      margin:
                        "5px 0 0"
                    }}
                  >
                    {editingProject
                      ? "Edit Project"
                      : "Add Project"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    closeProjectModal
                  }
                  disabled={
                    actionLoading
                  }
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={saveProject}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "15px"
                  }}
                >
                  <div
                    style={{
                      gridColumn:
                        "1 / -1"
                    }}
                  >
                    <label>
                      Project Name
                    </label>

                    <input
                      type="text"
                      name="title"
                      value={
                        projectForm.title
                      }
                      onChange={
                        handleProjectChange
                      }
                      placeholder="Enter project name"
                      disabled={
                        actionLoading
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding:
                          "12px 14px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label>
                      Category
                    </label>

                    <input
                      type="text"
                      name="category"
                      value={
                        projectForm.category
                      }
                      onChange={
                        handleProjectChange
                      }
                      placeholder="Education, Health..."
                      disabled={
                        actionLoading
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding:
                          "12px 14px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label>
                      Target Amount
                    </label>

                    <input
                      type="number"
                      name="goal"
                      value={
                        projectForm.goal
                      }
                      onChange={
                        handleProjectChange
                      }
                      placeholder="500000"
                      min="1"
                      step="0.01"
                      disabled={
                        actionLoading
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding:
                          "12px 14px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label>
                      End Date
                    </label>

                    <input
                      type="date"
                      name="deadline"
                      value={
                        projectForm.deadline
                      }
                      onChange={
                        handleProjectChange
                      }
                      disabled={
                        actionLoading
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding:
                          "12px 14px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        projectForm.status
                      }
                      onChange={
                        handleProjectChange
                      }
                      disabled={
                        actionLoading
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding:
                          "12px 14px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px"
                      }}
                    >
                      <option value="active">
                        Active
                      </option>

                      <option value="pending">
                        Pending
                      </option>

                      <option value="completed">
                        Completed
                      </option>
                    </select>
                  </div>

                  <div
                    style={{
                      gridColumn:
                        "1 / -1"
                    }}
                  >
                    <label>
                      Image URL
                    </label>

                    <input
                      type="text"
                      name="image_url"
                      value={
                        projectForm.image_url
                      }
                      onChange={
                        handleProjectChange
                      }
                      placeholder="https://..."
                      disabled={
                        actionLoading
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding:
                          "12px 14px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px"
                      }}
                    />
                  </div>

                  <div
                    style={{
                      gridColumn:
                        "1 / -1"
                    }}
                  >
                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        projectForm.description
                      }
                      onChange={
                        handleProjectChange
                      }
                      placeholder="Describe this project..."
                      rows="5"
                      disabled={
                        actionLoading
                      }
                      style={{
                        width: "100%",
                        marginTop: "6px",
                        padding:
                          "12px 14px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "10px",
                        resize:
                          "vertical"
                      }}
                    />
                  </div>
                </div>

                {editingProject && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px",
                      borderRadius:
                        "10px",
                      background:
                        "#f6f6f6"
                    }}
                  >
                    <small>
                      Collected Amount
                    </small>

                    <h3
                      style={{
                        margin:
                          "5px 0 0"
                      }}
                    >
                      {formatAmount(
                        editingProject.raised
                      )}
                    </h3>

                    <small
                      style={{
                        opacity: 0.6
                      }}
                    >
                      Collected amount is
                      automatically calculated
                      from completed donations.
                    </small>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "flex-end",
                    gap: "10px",
                    marginTop: "22px"
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      closeProjectModal
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      actionLoading
                    }
                  >
                    {actionLoading
                      ? "Saving..."
                      : editingProject
                      ? "Update Project"
                      : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
   * ==========================================
   * DONATION MANAGEMENT PAGE
   * ==========================================
   */

  if (isDonations) {
    return (
      <div>
        <div className="pagebar">
          <div>
            <span className="eyebrow">
              MANAGEMENT
            </span>

            <h1>Donation Management</h1>
          </div>

          <span className="count">
            {data.length} donations
          </span>
        </div>

        {err && (
          <div className="alert">
            {err}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "20px"
          }}
        >
          <div className="dashboard-panel">
            <small>Total Completed</small>
            <h2>
              {formatAmount(
                completedTotal
              )}
            </h2>
          </div>

          <div className="dashboard-panel">
            <small>Completed</small>
            <h2>
              {completedCount}
            </h2>
          </div>

          <div className="dashboard-panel">
            <small>Pending</small>
            <h2>
              {pendingCount}
            </h2>
          </div>

          <div className="dashboard-panel">
            <small>Failed</small>
            <h2>
              {failedCount}
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}
        >
          <input
            type="text"
            placeholder="Search donor, email, transaction..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              flex: 1,
              minWidth: "260px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}
          >
            <option value="all">
              All Status
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="failed">
              Failed
            </option>
          </select>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Donor</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDonations.map(
                (donation) => (
                  <tr key={donation.id}>
                    <td>
                      #{donation.id}
                    </td>

                    <td>
                      <strong>
                        {donation.donor_name ||
                          "Unknown Donor"}
                      </strong>

                      <br />

                      <small>
                        {donation.donor_email ||
                          "—"}
                      </small>
                    </td>

                    <td>
                      {formatAmount(
                        donation.amount
                      )}
                    </td>

                    <td>
                      {formatDate(
                        donation.created_at
                      )}
                    </td>

                    <td>
                      {donation.payment_method ||
                        "—"}
                    </td>

                    <td>
                      <select
                        value={
                          normalizeStatus(
                            donation.status
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        onChange={(e) =>
                          updateDonationStatus(
                            donation.id,
                            e.target.value
                          )
                        }
                      >
                        <option value="completed">
                          Completed
                        </option>

                        <option value="pending">
                          Pending
                        </option>

                        <option value="failed">
                          Failed
                        </option>
                      </select>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px"
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDonation(
                              donation
                            )
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteDonation(
                              donation.id
                            )
                          }
                          disabled={
                            actionLoading
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {!filteredDonations.length &&
            !loading && (
              <div className="empty">
                No donations found.
              </div>
            )}

          {loading && (
            <div className="empty">
              Loading donations...
            </div>
          )}
        </div>

        {selectedDonation && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px"
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "25px",
                width: "100%",
                maxWidth: "520px"
              }}
            >
              <h2>
                Donation Details
              </h2>

              <p>
                <strong>ID:</strong>{" "}
                #{selectedDonation.id}
              </p>

              <p>
                <strong>Donor:</strong>{" "}
                {selectedDonation.donor_name}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {selectedDonation.donor_email}
              </p>

              <p>
                <strong>Amount:</strong>{" "}
                {formatAmount(
                  selectedDonation.amount
                )}
              </p>

              <p>
                <strong>Campaign:</strong>{" "}
                {selectedDonation.project_title ||
                  "—"}
              </p>

              <p>
                <strong>Payment:</strong>{" "}
                {selectedDonation.payment_method ||
                  "—"}
              </p>

              <p>
                <strong>Transaction:</strong>{" "}
                {selectedDonation.transaction_id ||
                  "—"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {selectedDonation.status}
              </p>

              <p>
                <strong>Date:</strong>{" "}
                {formatDate(
                  selectedDonation.created_at
                )}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop: "20px"
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDonation(
                      null
                    )
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteDonation(
                      selectedDonation.id
                    )
                  }
                  disabled={
                    actionLoading
                  }
                >
                  Delete Donation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

    /* ==========================================
   * VOLUNTEER MANAGEMENT PAGE
   * ========================================== */

  if (isVolunteers) {
    return (
      <div>
        <div className="pagebar">
          <div>
            <span className="eyebrow">MANAGEMENT</span>
            <h1>Volunteer Management</h1>
            <p
              style={{
                margin: "7px 0 0",
                opacity: 0.65,
                fontSize: "13px"
              }}
            >
              Manage volunteer registrations and information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setErr("");
              setVolunteerForm({
                name: "",
                email: "",
                phone: "",
                interest: "",
                availability: ""
              });
              setVolunteerModal(true);
            }}
            disabled={actionLoading}
          >
            + Add Volunteer
          </button>
        </div>

        {err && <div className="alert">{err}</div>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "20px"
          }}
        >
          <div className="dashboard-panel">
            <small>Total Volunteers</small>
            <h2>{data.length}</h2>
          </div>

          <div className="dashboard-panel">
            <small>Approved</small>
            <h2>
              {
                data.filter(
                  (v) => normalizeStatus(v.status) === "approved"
                ).length
              }
            </h2>
          </div>

          <div className="dashboard-panel">
            <small>Pending</small>
            <h2>
              {
                data.filter(
                  (v) => normalizeStatus(v.status) === "pending"
                ).length
              }
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}
        >
          <input
            type="text"
            placeholder="Search name, email, phone or interest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: "240px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Interest</th>
                <th>Availability</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredVolunteers.map((volunteer) => (
                <tr key={volunteer.id}>
                  <td>
                    <strong>{volunteer.name || "—"}</strong>
                  </td>

                  <td>{volunteer.email || "—"}</td>
                  <td>{volunteer.phone || "—"}</td>
                  <td>{volunteer.interest || "—"}</td>
                  <td>{volunteer.availability || "—"}</td>

                  <td>
                    <select
                      value={normalizeStatus(volunteer.status) || "pending"}
                      disabled={actionLoading}
                      onChange={(e) =>
                        updateVolunteerStatus(
                          volunteer.id,
                          e.target.value
                        )
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => deleteVolunteer(volunteer.id)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="empty">Loading volunteers...</div>
          )}

          {!loading && filteredVolunteers.length === 0 && (
            <div className="empty">No volunteers found.</div>
          )}
        </div>

        {volunteerModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
              overflowY: "auto"
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "25px",
                width: "100%",
                maxWidth: "520px",
                maxHeight: "90vh",
                overflowY: "auto"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px"
                }}
              >
                <h2 style={{ margin: 0 }}>Add Volunteer</h2>

                <button
                  type="button"
                  onClick={() => {
                    if (actionLoading) return;
                    setVolunteerModal(false);
                    setErr("");
                  }}
                  disabled={actionLoading}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveVolunteer}>
                <div
                  style={{
                    display: "grid",
                    gap: "15px"
                  }}
                >
                  <div>
                    <label htmlFor="volunteer-name">Full Name *</label>
                    <input
                      id="volunteer-name"
                      type="text"
                      value={volunteerForm.name}
                      onChange={(e) =>
                        setVolunteerForm((previous) => ({
                          ...previous,
                          name: e.target.value
                        }))
                      }
                      placeholder="Enter full name"
                      required
                      disabled={actionLoading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "6px",
                        padding: "12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="volunteer-email">Email *</label>
                    <input
                      id="volunteer-email"
                      type="email"
                      value={volunteerForm.email}
                      onChange={(e) =>
                        setVolunteerForm((previous) => ({
                          ...previous,
                          email: e.target.value
                        }))
                      }
                      placeholder="Enter email address"
                      required
                      disabled={actionLoading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "6px",
                        padding: "12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="volunteer-phone">Phone *</label>
                    <input
                      id="volunteer-phone"
                      type="tel"
                      value={volunteerForm.phone}
                      onChange={(e) =>
                        setVolunteerForm((previous) => ({
                          ...previous,
                          phone: e.target.value
                        }))
                      }
                      placeholder="Enter phone number"
                      required
                      disabled={actionLoading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "6px",
                        padding: "12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="volunteer-interest">Area of Interest</label>
                    <input
                      id="volunteer-interest"
                      type="text"
                      value={volunteerForm.interest}
                      onChange={(e) =>
                        setVolunteerForm((previous) => ({
                          ...previous,
                          interest: e.target.value
                        }))
                      }
                      placeholder="Education, Health, Fundraising..."
                      disabled={actionLoading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "6px",
                        padding: "12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "10px"
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="volunteer-availability">Availability</label>
                    <select
                      id="volunteer-availability"
                      value={volunteerForm.availability}
                      onChange={(e) =>
                        setVolunteerForm((previous) => ({
                          ...previous,
                          availability: e.target.value
                        }))
                      }
                      disabled={actionLoading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "6px",
                        padding: "12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "10px"
                      }}
                    >
                      <option value="">Select availability</option>
                      <option value="Weekends">Weekends</option>
                      <option value="Evenings">Evenings</option>
                      <option value="Weekdays">Weekdays</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "22px"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (actionLoading) return;
                      setVolunteerModal(false);
                      setErr("");
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>

                  <button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Saving..." : "Register Volunteer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  
/* ==========================================
 * SPONSOR MANAGEMENT PAGE
 * ========================================== */

if (isSponsors) {
  return (
    <div>
      <div className="pagebar">
        <div>
          <span className="eyebrow">MANAGEMENT</span>
          <h1>Sponsor Management</h1>
          <p style={{ margin: "7px 0 0", opacity: 0.65, fontSize: "13px" }}>
            Manage sponsors, contributions and sponsored projects.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddSponsor}
          disabled={actionLoading}
        >
          + Add Sponsor
        </button>
      </div>

      {err && <div className="alert">{err}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "16px",
          marginBottom: "20px"
        }}
      >
        <div className="dashboard-panel">
          <small>Total Sponsors</small>
          <h2>{data.length}</h2>
        </div>

        <div className="dashboard-panel">
          <small>Total Sponsorship Amount</small>
          <h2>{formatAmount(totalSponsorship)}</h2>
        </div>

        <div className="dashboard-panel">
          <small>Active Sponsors</small>
          <h2>
            {data.filter((s) => normalizeStatus(s.status) === "active").length}
          </h2>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap"
        }}
      >
        <input
          type="text"
          placeholder="Search sponsor, company, email or project..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "240px",
            padding: "12px 14px",
            border: "1px solid #ddd",
            borderRadius: "10px"
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "12px 14px",
            border: "1px solid #ddd",
            borderRadius: "10px"
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Sponsor</th>
              <th>Contact</th>
              <th>Amount</th>
              <th>Sponsored Project</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredSponsors.map((sponsor) => (
              <tr key={sponsor.id}>
                <td>
                  <strong>{sponsor.name || "—"}</strong>
                  <br />
                  <small>{sponsor.company || "Individual Sponsor"}</small>
                  {sponsor.website && (
                    <>
                      <br />
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    </>
                  )}
                </td>

                <td>
                  <div>{sponsor.email || "—"}</div>
                  <small>{sponsor.phone || "—"}</small>
                </td>

                <td>
                  <strong>{formatAmount(sponsor.contribution)}</strong>
                </td>

                <td>{sponsor.sponsored_project || "—"}</td>

                <td>{formatDate(sponsor.sponsorship_date || sponsor.created_at)}</td>

                <td>
                  <select
                    value={normalizeStatus(sponsor.status) || "active"}
                    disabled={actionLoading}
                    onChange={async (e) => {
                      try {
                        setActionLoading(true);
                        setErr("");

                        await sponsors.update(sponsor.id, {
                          name: sponsor.name,
                          company: sponsor.company,
                          email: sponsor.email,
                          phone: sponsor.phone,
                          contribution: Number(sponsor.contribution || 0),
                          website: sponsor.website,
                          sponsored_project: sponsor.sponsored_project,
                          sponsorship_date: formatDateInput(sponsor.sponsorship_date),
                          status: e.target.value
                        });

                        await loadData();
                      } catch (error) {
                        setErr(
                          error.response?.data?.message ||
                            "Unable to update sponsor status."
                        );
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>

                <td>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => openEditSponsor(sponsor)}
                      disabled={actionLoading}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSponsor(sponsor.id)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="empty">Loading sponsors...</div>}

        {!loading && filteredSponsors.length === 0 && (
          <div className="empty">No sponsors found.</div>
        )}
      </div>

      {sponsorModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            overflowY: "auto"
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "25px",
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <h2 style={{ margin: 0 }}>
                {editingSponsor ? "Edit Sponsor" : "Add Sponsor"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  if (actionLoading) return;
                  setSponsorModal(false);
                  setEditingSponsor(null);
                  setErr("");
                }}
                disabled={actionLoading}
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveSponsor}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "15px"
                }}
              >
                {[
                  ["name", "Sponsor Name *", "text", "Enter sponsor name"],
                  ["company", "Company Name", "text", "Enter company name"],
                  ["email", "Email *", "email", "Enter email address"],
                  ["phone", "Phone", "tel", "Enter phone number"],
                  ["contribution", "Sponsorship Amount (₹) *", "number", "Enter amount"],
                  ["website", "Website", "url", "https://example.com"]
                ].map(([name, label, inputType, placeholder]) => (
                  <div key={name}>
                    <label htmlFor={`sponsor-${name}`}>{label}</label>
                    <input
                      id={`sponsor-${name}`}
                      name={name}
                      type={inputType}
                      value={sponsorForm[name]}
                      onChange={handleSponsorChange}
                      placeholder={placeholder}
                      required={["name", "email", "contribution"].includes(name)}
                      min={name === "contribution" ? "0" : undefined}
                      step={name === "contribution" ? "0.01" : undefined}
                      disabled={actionLoading}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "6px",
                        padding: "12px 14px",
                        border: "1px solid #ddd",
                        borderRadius: "10px"
                      }}
                    />
                  </div>
                ))}

                <div>
                  <label htmlFor="sponsor-project">Sponsored Project</label>
                  <select
                    id="sponsor-project"
                    name="sponsored_project"
                    value={sponsorForm.sponsored_project}
                    onChange={handleSponsorChange}
                    disabled={actionLoading}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: "6px",
                      padding: "12px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "10px"
                    }}
                  >
                    <option value="">Select a project</option>
                    {sponsorProjects.map((project) => (
                      <option key={project.id} value={project.title}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sponsor-date">Sponsorship Date</label>
                  <input
                    id="sponsor-date"
                    name="sponsorship_date"
                    type="date"
                    value={sponsorForm.sponsorship_date}
                    onChange={handleSponsorChange}
                    disabled={actionLoading}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: "6px",
                      padding: "12px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "10px"
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="sponsor-status">Status</label>
                  <select
                    id="sponsor-status"
                    name="status"
                    value={sponsorForm.status}
                    onChange={handleSponsorChange}
                    disabled={actionLoading}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      marginTop: "6px",
                      padding: "12px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "10px"
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "22px"
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (actionLoading) return;
                    setSponsorModal(false);
                    setEditingSponsor(null);
                    setErr("");
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button type="submit" disabled={actionLoading}>
                  {actionLoading
                    ? "Saving..."
                    : editingSponsor
                    ? "Update Sponsor"
                    : "Add Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

  /*
   * ==========================================
   * USERS MANAGEMENT PAGE
   * ==========================================
   */

  if (isUsers) {
    const searchText = search.trim().toLowerCase();

    const filteredUsers = data.filter((user) => {
      const matchesSearch =
        !searchText ||
        [user.name, user.email, user.phone]
          .some((value) =>
            String(value || "").toLowerCase().includes(searchText)
          );

      const matchesRole =
        userRoleFilter === "all" ||
        String(user.role || "user").toLowerCase() === userRoleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        String(user.status || "active").toLowerCase() === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });

    return (
      <div>
        <div className="pagebar">
          <div>
            <span className="eyebrow">MANAGEMENT</span>
            <h1>Users Management</h1>
            <p style={{ marginTop: 7, opacity: 0.7 }}>
              Manage registered users, roles and account status.
            </p>
          </div>

          <span className="count">{filteredUsers.length} users</span>
        </div>

        {err && <div className="alert">{err}</div>}

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20
          }}
        >
          <input
            type="text"
            placeholder="Search name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: 10
            }}
          />

          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            style={{ padding: "12px", border: "1px solid #ddd", borderRadius: 10 }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">Donor / User</option>
            <option value="volunteer">Volunteer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "12px", border: "1px solid #ddd", borderRadius: 10 }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name || "—"}</td>
                  <td>{user.email || "—"}</td>
                  <td>{user.phone || "—"}</td>

                  <td>
                    {String(user.role || "user").toLowerCase() === "admin"
                      ? "Admin"
                      : String(user.role || "user").toLowerCase() === "volunteer"
                      ? "Volunteer"
                      : "Donor / User"}
                  </td>

                  <td>{formatDate(user.created_at)}</td>

                  <td>
                    <select
                      value={String(user.status || "active").toLowerCase()}
                      disabled={actionLoading}
                      onChange={async (e) => {
                        const newStatus = e.target.value;

                        try {
                          setActionLoading(true);
                          setErr("");

                          await users.updateStatus(user.id, newStatus);
                          await loadData();
                        } catch (error) {
                          setErr(
                            error.response?.data?.message ||
                              "Unable to update user status."
                          );
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>

                  <td>
                    <button
                      type="button"
                      disabled={actionLoading}
                      title="Delete user"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `Delete user "${user.name}"? This action cannot be undone.`
                          )
                        ) {
                          return;
                        }

                        try {
                          setActionLoading(true);
                          setErr("");

                          await users.remove(user.id);
                          await loadData();
                        } catch (error) {
                          setErr(
                            error.response?.data?.message ||
                              "Unable to delete user."
                          );
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && <div className="empty">Loading users...</div>}

          {!loading && filteredUsers.length === 0 && !err && (
            <div className="empty">No users found.</div>
          )}
        </div>
      </div>
    );
  }

  /*
   * ==========================================
   * OTHER MANAGEMENT PAGES
   * ==========================================
   */

  return (
    <div>
      <div className="pagebar">
        <div>
          <span className="eyebrow">
            MANAGEMENT
          </span>

          <h1>{c.title}</h1>
        </div>

        <span className="count">
          {data.length} records
        </span>
      </div>

      {err && (
        <div className="alert">
          {err}
        </div>
      )}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              {c.cols.map((x) => (
                <th key={x}>
                  {x.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((r, i) => (
              <tr key={r.id || i}>
                {c.cols.map((k) => (
                  <td key={k}>
                    {k === "amount" ||
                    k === "goal" ||
                    k === "raised"
                      ? formatAmount(r[k])
                      : k === "created_at"
                      ? formatDate(
                          r[k]
                        )
                      : k === "status"
                      ? statusLabel(
                          r[k]
                        )
                      : String(
                          r[k] ?? "—"
                        )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {!data.length && !err && (
          <div className="empty">
            No records found.
          </div>
        )}

        {loading && (
          <div className="empty">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}