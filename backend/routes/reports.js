
const express = require("express");
const pool = require("../config/db");
const {
  authenticateToken,
  adminOnly,
} = require("../middleware/auth");

const router = express.Router();

// Accept only valid YYYY-MM-DD dates.
function validDate(value) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

function dateFilter(column, from, to) {
  const conditions = [];
  const values = [];

  if (from) {
    conditions.push(`DATE(${column}) >= ?`);
    values.push(from);
  }

  if (to) {
    conditions.push(`DATE(${column}) <= ?`);
    values.push(to);
  }

  return {
    sql: conditions.length ? ` AND ${conditions.join(" AND ")}` : "",
    values,
  };
}

function readDates(req, res) {
  const from = validDate(req.query.from);
  const to = validDate(req.query.to);

  if (from === undefined || to === undefined) {
    res.status(400).json({
      success: false,
      message: "Dates must use the YYYY-MM-DD format.",
    });
    return null;
  }

  if (from && to && from > to) {
    res.status(400).json({
      success: false,
      message: "From Date cannot be after To Date.",
    });
    return null;
  }

  return { from, to };
}

router.use(authenticateToken, adminOnly);

// DONATION REPORT
router.get("/donations", async (req, res) => {
  try {
    const dates = readDates(req, res);
    if (!dates) return;

    const filter = dateFilter("d.created_at", dates.from, dates.to);
    const [donations] = await pool.query(
      `SELECT d.id, d.amount, d.payment_method, d.transaction_id,
              d.status, d.created_at,
              u.name AS donor_name, u.email AS donor_email,
              c.title AS project_title
       FROM donations d
       INNER JOIN users u ON u.id = d.user_id
       INNER JOIN campaigns c ON c.id = d.campaign_id
       WHERE 1=1 ${filter.sql}
       ORDER BY d.created_at DESC`,
      filter.values
    );

    res.json({ success: true, donations });
  } catch (error) {
    console.error("DONATION REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate donation report.",
    });
  }
});

// PROJECT REPORT
router.get("/projects", async (req, res) => {
  try {
    const dates = readDates(req, res);
    if (!dates) return;

    const filter = dateFilter("d.created_at", dates.from, dates.to);
    const [projects] = await pool.query(
      `SELECT c.id, c.title, c.goal, c.status,
              COALESCE(SUM(
                CASE WHEN d.status = 'completed' THEN d.amount ELSE 0 END
              ), 0) AS raised,
              COUNT(CASE WHEN d.status = 'completed' THEN d.id END)
                AS donation_count
       FROM campaigns c
       LEFT JOIN donations d ON d.campaign_id = c.id ${filter.sql}
       GROUP BY c.id, c.title, c.goal, c.status
       ORDER BY raised DESC`,
      filter.values
    );

    res.json({ success: true, projects });
  } catch (error) {
    console.error("PROJECT REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate project report.",
    });
  }
});

// VOLUNTEER REPORT
router.get("/volunteers", async (req, res) => {
  try {
    const dates = readDates(req, res);
    if (!dates) return;

    const filter = dateFilter("created_at", dates.from, dates.to);
    const [volunteers] = await pool.query(
      `SELECT id, name, email, phone, interest, availability,
              status, created_at
       FROM volunteers
       WHERE 1=1 ${filter.sql}
       ORDER BY created_at DESC`,
      filter.values
    );

    res.json({ success: true, volunteers });
  } catch (error) {
    console.error("VOLUNTEER REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate volunteer report.",
    });
  }
});

// SPONSOR REPORT: filter by sponsorship_date, or created_at when absent.
router.get("/sponsors", async (req, res) => {
  try {
    const dates = readDates(req, res);
    if (!dates) return;

    const conditions = [];
    const values = [];

    if (dates.from) {
      conditions.push(
        "(s.sponsorship_date >= ? OR (s.sponsorship_date IS NULL AND DATE(s.created_at) >= ?))"
      );
      values.push(dates.from, dates.from);
    }

    if (dates.to) {
      conditions.push(
        "(s.sponsorship_date <= ? OR (s.sponsorship_date IS NULL AND DATE(s.created_at) <= ?))"
      );
      values.push(dates.to, dates.to);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [sponsors] = await pool.query(
      `SELECT id, name, company, email, phone, contribution,
              sponsored_project, sponsorship_date, status, created_at
       FROM sponsors s
       ${where}
       ORDER BY COALESCE(s.sponsorship_date, DATE(s.created_at)) DESC`,
      values
    );

    res.json({ success: true, sponsors });
  } catch (error) {
    console.error("SPONSOR REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate sponsor report.",
    });
  }
});

// FUNDRAISING SUMMARY
router.get("/fundraising", async (req, res) => {
  try {
    const dates = readDates(req, res);
    if (!dates) return;

    const filter = dateFilter("created_at", dates.from, dates.to);

    const [[summary]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_raised,
              COUNT(*) AS total_donations,
              COALESCE(AVG(amount), 0) AS average_donation
       FROM donations
       WHERE status = 'completed' ${filter.sql}`,
      filter.values
    );

    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              SUM(amount) AS amount, COUNT(*) AS donations
       FROM donations
       WHERE status = 'completed' ${filter.sql}
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      filter.values
    );

    const projectFilter = dateFilter("d.created_at", dates.from, dates.to);
    const [projects] = await pool.query(
      `SELECT c.id, c.title, c.goal,
              COALESCE(SUM(
                CASE WHEN d.status = 'completed' THEN d.amount ELSE 0 END
              ), 0) AS raised
       FROM campaigns c
       LEFT JOIN donations d ON d.campaign_id = c.id ${projectFilter.sql}
       GROUP BY c.id, c.title, c.goal
       ORDER BY raised DESC`,
      projectFilter.values
    );

    res.json({
      success: true,
      summary: {
        totalRaised: Number(summary.total_raised),
        totalDonations: Number(summary.total_donations),
        averageDonation: Number(summary.average_donation),
      },
      monthly,
      projects,
    });
  } catch (error) {
    console.error("FUNDRAISING REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to generate fundraising report.",
    });
  }
});

// TOP DONORS
router.get("/top-donors", async (req, res) => {
  try {
    const dates = readDates(req, res);
    if (!dates) return;

    const filter = dateFilter("d.created_at", dates.from, dates.to);
    const [donors] = await pool.query(
      `SELECT u.id, u.name, u.email,
              COUNT(d.id) AS donation_count,
              SUM(d.amount) AS total_donated
       FROM users u
       INNER JOIN donations d ON d.user_id = u.id
       WHERE d.status = 'completed' ${filter.sql}
       GROUP BY u.id, u.name, u.email
       ORDER BY total_donated DESC
       LIMIT 10`,
      filter.values
    );

    res.json({ success: true, donors });
  } catch (error) {
    console.error("TOP DONORS REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load top donors.",
    });
  }
});

module.exports = router;
