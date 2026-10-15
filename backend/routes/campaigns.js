
const express = require("express");
const pool = require("../config/db");
const { authenticateToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

function formatProject(project) {
    const raised = Number(project.raised || 0);
    const goal = Number(project.goal || 0);

    return {
        ...project,
        raised,
        goal,
        progress: goal > 0
            ? Math.min(100, Math.round((raised / goal) * 100))
            : 0
    };
}

// Reusable query: avoids duplicate donation rows
const PROJECT_QUERY = `
    SELECT
        c.id,
        c.title,
        c.category,
        c.description,
        c.goal,
        c.image_url,
        c.deadline,
        c.status,
        c.created_at,
        COALESCE(d.raised, 0) AS raised
    FROM campaigns c
    LEFT JOIN (
        SELECT campaign_id, SUM(amount) AS raised
        FROM donations
        WHERE status = 'completed'
        GROUP BY campaign_id
    ) d ON d.campaign_id = c.id
`;

// PUBLIC: active projects
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(
            PROJECT_QUERY + `
            WHERE c.status = 'active'
            ORDER BY c.created_at DESC`
        );

        res.json({
            success: true,
            projects: rows.map(formatProject)
        });
    } catch (error) {
        console.error("PUBLIC PROJECTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load projects",
            error: error.message
        });
    }
});

// ADMIN: all projects
router.get("/admin/all", authenticateToken, adminOnly, async (req, res) => {
    try {
        const [rows] = await pool.query(
            PROJECT_QUERY + ` ORDER BY c.created_at DESC`
        );

        res.json({
            success: true,
            projects: rows.map(formatProject)
        });
    } catch (error) {
        console.error("ADMIN PROJECTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load admin projects",
            error: error.message
        });
    }
});

// PUBLIC: one project
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(
            PROJECT_QUERY + ` WHERE c.id = ?`,
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.json({
            success: true,
            project: formatProject(rows[0])
        });
    } catch (error) {
        console.error("SINGLE PROJECT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load project",
            error: error.message
        });
    }
});

// ADMIN: create project
router.post("/", authenticateToken, adminOnly, async (req, res) => {
    try {
        const {
            title, category, description,
            goal, image_url, deadline, status
        } = req.body;

        if (
            !title?.trim() ||
            !category?.trim() ||
            !description?.trim() ||
            goal === undefined || goal === null || goal === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, category, description and goal are required"
            });
        }

        const numericGoal = Number(goal);

        if (!Number.isFinite(numericGoal) || numericGoal <= 0) {
            return res.status(400).json({
                success: false,
                message: "Goal must be greater than zero"
            });
        }

        const safeStatus = ["active", "closed"].includes(
            String(status || "active").toLowerCase()
        ) ? String(status || "active").toLowerCase() : "active";

        const [result] = await pool.query(
            `INSERT INTO campaigns
            (title, category, description, goal, image_url, deadline, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                category.trim(),
                description.trim(),
                numericGoal,
                image_url || null,
                deadline || null,
                safeStatus
            ]
        );

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            projectId: result.insertId
        });
    } catch (error) {
        console.error("CREATE PROJECT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to create project",
            error: error.message
        });
    }
});

// ADMIN: update project
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
        const {
            title, category, description,
            goal, image_url, deadline, status
        } = req.body;

        if (
            !title?.trim() ||
            !category?.trim() ||
            !description?.trim() ||
            goal === undefined || goal === null || goal === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, category, description and goal are required"
            });
        }

        const numericGoal = Number(goal);

        if (!Number.isFinite(numericGoal) || numericGoal <= 0) {
            return res.status(400).json({
                success: false,
                message: "Goal must be greater than zero"
            });
        }

        const safeStatus = ["active", "closed"].includes(
            String(status || "active").toLowerCase()
        ) ? String(status || "active").toLowerCase() : "active";

        const [result] = await pool.query(
            `UPDATE campaigns
             SET title = ?, category = ?, description = ?,
                 goal = ?, image_url = ?, deadline = ?, status = ?
             WHERE id = ?`,
            [
                title.trim(),
                category.trim(),
                description.trim(),
                numericGoal,
                image_url || null,
                deadline || null,
                safeStatus,
                req.params.id
            ]
        );

        if (!result.affectedRows) {
            const [existing] = await pool.query(
                "SELECT id FROM campaigns WHERE id = ?",
                [req.params.id]
            );

            if (!existing.length) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found"
                });
            }
        }

        res.json({
            success: true,
            message: "Project updated successfully"
        });
    } catch (error) {
        console.error("UPDATE PROJECT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update project",
            error: error.message
        });
    }
});

// ADMIN: delete project
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM campaigns WHERE id = ?",
            [req.params.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        res.json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error("DELETE PROJECT ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Unable to delete project",
            error: error.message
        });
    }
});

module.exports = router;
