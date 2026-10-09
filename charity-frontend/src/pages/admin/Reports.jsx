
import { useEffect, useState } from "react";
import { reports } from "../../services/services";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const dateText = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-IN");
};

const reportOptions = [
  { value: "donations", label: "Donation Report" },
  { value: "projects", label: "Project Report" },
  { value: "volunteers", label: "Volunteer Report" },
  { value: "sponsors", label: "Sponsor Report" },
  { value: "fundraising", label: "Fundraising Report" },
];

const columns = {
  donations: [
    ["id", "ID"],
    ["donor_name", "Donor"],
    ["donor_email", "Email"],
    ["project_title", "Project"],
    ["amount", "Amount (INR)"],
    ["payment_method", "Payment Method"],
    ["transaction_id", "Transaction ID"],
    ["status", "Status"],
    ["created_at", "Donation Date"],
  ],
  projects: [
    ["id", "ID"],
    ["title", "Project"],
    ["goal", "Goal (INR)"],
    ["raised", "Raised (INR)"],
    ["donation_count", "Completed Donations"],
    ["status", "Status"],
  ],
  volunteers: [
    ["id", "ID"],
    ["name", "Name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["interest", "Interest"],
    ["availability", "Availability"],
    ["status", "Status"],
    ["created_at", "Registration Date"],
  ],
  sponsors: [
    ["id", "ID"],
    ["name", "Name"],
    ["company", "Company"],
    ["email", "Email"],
    ["contribution", "Contribution (INR)"],
    ["sponsored_project", "Sponsored Project"],
    ["sponsorship_date", "Sponsorship Date"],
    ["status", "Status"],
  ],
  fundraising: [
    ["title", "Project"],
    ["goal", "Goal (INR)"],
    ["raised", "Raised (INR)"],
    ["progress", "Goal Achieved (%)"],
  ],
};

export default function Reports() {
  const [type, setType] = useState("fundraising");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [donors, setDonors] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedDates, setAppliedDates] = useState({ from: "", to: "" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setData([]);
      setSummary(null);
      setDonors([]);
      setMonthly([]);

      try {
        const params = {};
        if (appliedDates.from) params.from = appliedDates.from;
        if (appliedDates.to) params.to = appliedDates.to;

        let response;

        if (type === "donations") {
          response = await reports.donations(params);
          if (!cancelled) setData(response.data.donations || []);
        } else if (type === "projects") {
          response = await reports.projects(params);
          if (!cancelled) setData(response.data.projects || []);
        } else if (type === "volunteers") {
          response = await reports.volunteers(params);
          if (!cancelled) setData(response.data.volunteers || []);
        } else if (type === "sponsors") {
          response = await reports.sponsors(params);
          if (!cancelled) setData(response.data.sponsors || []);
        } else {
          const [fundResult, donorResult] = await Promise.all([
            reports.fundraising(params),
            reports.topDonors(params),
          ]);

          if (!cancelled) {
            setSummary(fundResult.data.summary || {});
            setMonthly(fundResult.data.monthly || []);
            setData(
              (fundResult.data.projects || []).map((project) => {
                const goal = Number(project.goal || 0);
                const raised = Number(project.raised || 0);

                return {
                  ...project,
                  progress:
                    goal > 0
                      ? Math.min(100, (raised / goal) * 100).toFixed(1)
                      : "0.0",
                };
              })
            );
            setDonors(donorResult.data.donors || []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load report. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [type, appliedDates]);

  const selectedColumns = columns[type];

  const cellValue = (row, key) => {
    const value = row[key];

    if (["amount", "goal", "raised", "contribution", "total_donated"].includes(key)) {
      return money(value);
    }

    if (["created_at", "sponsorship_date"].includes(key)) {
      return dateText(value);
    }

    return value ?? "—";
  };

  const downloadCSV = () => {
    const csvRows = [
      selectedColumns.map(([, label]) => label),
      ...data.map((row) =>
        selectedColumns.map(([key]) => cellValue(row, key))
      ),
    ];

    const escapeCell = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = "\uFEFF" +
      csvRows.map((row) => row.map(escapeCell).join(",")).join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-report.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const applyDates = (event) => {
    event.preventDefault();

    if (from && to && from > to) {
      setError("From Date cannot be after To Date.");
      return;
    }

    setError("");
    setAppliedDates({ from, to });
  };

  const clearDates = () => {
    setFrom("");
    setTo("");
    setAppliedDates({ from: "", to: "" });
    setError("");
  };

  return (
    <div className="reports-page">
      <style>{`
        .report-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 14px;
          align-items: end;
        }
        .report-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 7px;
        }
        .report-field select,
        .report-field input {
          width: 100%;
          min-height: 42px;
          padding: 9px 11px;
          border: 1px solid var(--border, #d1d5db);
          border-radius: 9px;
          background: var(--panel, #fff);
          color: inherit;
        }
        .report-button {
          border: 0;
          border-radius: 9px;
          padding: 11px 15px;
          min-height: 42px;
          cursor: pointer;
          font-weight: 600;
        }
        .report-primary {
          background: #16784b;
          color: white;
        }
        .report-secondary {
          background: var(--border, #e5e7eb);
          color: inherit;
        }
        .report-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 680px;
        }
        .report-table th,
        .report-table td {
          padding: 13px 15px;
          text-align: left;
          border-bottom: 1px solid var(--border, #e5e7eb);
          white-space: nowrap;
          font-size: 13px;
        }
        .report-table th {
          background: var(--table-head, #f8fafc);
        }
        .report-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }
        @media print {
          .no-print,
          .sidebar,
          .admin-top {
            display: none !important;
          }
          .admin-shell,
          .admin-main,
          .admin-content,
          .reports-page {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          .report-table-wrap {
            overflow: visible !important;
          }
          .report-table {
            min-width: 0 !important;
            font-size: 10px !important;
          }
          .report-table th,
          .report-table td {
            white-space: normal !important;
            padding: 6px !important;
          }
          .dashboard-panel {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="pagebar">
        <div>
          <span className="eyebrow">ANALYTICS</span>
          <h1>Admin Reports</h1>
          <p style={{ color: "var(--muted, #6b7280)", marginTop: 7 }}>
            Review records, filter by date and export reports.
          </p>
        </div>
      </div>

      <section
        className="dashboard-panel no-print"
        style={{ marginBottom: 18 }}
      >
        <form onSubmit={applyDates}>
          <div className="report-controls">
            <div className="report-field">
              <label htmlFor="report-type">Report Type</label>
              <select
                id="report-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {reportOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="report-field">
              <label htmlFor="report-from">From Date</label>
              <input
                id="report-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>

            <div className="report-field">
              <label htmlFor="report-to">To Date</label>
              <input
                id="report-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>

            <button className="report-button report-primary" type="submit">
              Apply Filter
            </button>

            <button
              className="report-button report-secondary"
              type="button"
              onClick={clearDates}
            >
              Clear Dates
            </button>
          </div>
        </form>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          <button
            className="report-button report-primary"
            type="button"
            onClick={downloadCSV}
            disabled={loading || data.length === 0}
          >
            Download CSV
          </button>

          <button
            className="report-button report-secondary"
            type="button"
            onClick={() => window.print()}
            disabled={loading}
          >
            Print / Save as PDF
          </button>
        </div>
      </section>

      {error && (
        <div className="alert" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {type === "fundraising" && summary && !loading && (
        <div className="report-metrics" style={{ marginBottom: 18 }}>
          <div className="dashboard-panel">
            <span>Total Funds Raised</span>
            <h2>{money(summary.totalRaised)}</h2>
          </div>
          <div className="dashboard-panel">
            <span>Total Donations</span>
            <h2>{Number(summary.totalDonations || 0).toLocaleString("en-IN")}</h2>
          </div>
          <div className="dashboard-panel">
            <span>Average Donation</span>
            <h2>{money(summary.averageDonation)}</h2>
          </div>
        </div>
      )}

      <section className="dashboard-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 20px 12px" }}>
          <h2 style={{ margin: 0 }}>
            {reportOptions.find((option) => option.value === type)?.label}
          </h2>
          <p style={{ color: "var(--muted, #6b7280)", fontSize: 13 }}>
            {appliedDates.from || appliedDates.to
              ? `Date range: ${appliedDates.from || "Earliest"} to ${appliedDates.to || "Latest"}`
              : "Showing all available records"}
          </p>
        </div>

        {loading ? (
          <p style={{ padding: 20 }}>Loading report...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: 20 }}>No records found for this report and date range.</p>
        ) : (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  {selectedColumns.map(([, label]) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={row.id ?? `${type}-${index}`}>
                    {selectedColumns.map(([key]) => (
                      <td key={key}>
                        {type === "fundraising" &&
                        key === "progress"
                          ? `${row.progress}%`
                          : cellValue(row, key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {type === "fundraising" && !loading && monthly.length > 0 && (
        <section className="dashboard-panel" style={{ marginTop: 18 }}>
          <h2>Monthly Fundraising</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount (INR)</th>
                  <th>Donations</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((item) => (
                  <tr key={item.month}>
                    <td>{item.month}</td>
                    <td>{money(item.amount)}</td>
                    <td>{item.donations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {type === "fundraising" && !loading && donors.length > 0 && (
        <section className="dashboard-panel" style={{ marginTop: 18 }}>
          <h2>Top Donors</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Email</th>
                  <th>Donation Count</th>
                  <th>Total Donated</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((donor) => (
                  <tr key={donor.id}>
                    <td>{donor.name || "Unknown Donor"}</td>
                    <td>{donor.email || "—"}</td>
                    <td>{donor.donation_count}</td>
                    <td>{money(donor.total_donated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

