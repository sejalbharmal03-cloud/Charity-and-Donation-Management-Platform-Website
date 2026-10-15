const express = require("express");
const pool = require("../config/db");

const {
    authenticateToken,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();


// ==========================================
// FORMAT PROJECT
// ==========================================

function formatProject(project) {

    const raised = Number(project.raised || 0);
    const goal = Number(project.goal || 0);

    const progress =
        goal > 0
            ? Math.min(
                100,
                Math.round((raised / goal) * 100)
            )
            : 0;

    return {
        ...project,
        raised,
        goal,
        progress
    };
}


// ==========================================
// GET ALL ACTIVE PROJECTS
// PUBLIC
// ==========================================

router.get("/", async (req, res) => {

    try {

        const [projects] = await pool.query(`

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

                COALESCE(
                    SUM(
                        CASE
                            WHEN d.status = 'completed'
                            THEN d.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS raised

            FROM campaigns c

            LEFT JOIN donations d
                ON d.campaign_id = c.id

            WHERE c.status = 'active'

            GROUP BY c.id

            ORDER BY c.created_at DESC

        `);

        const formattedProjects =
            projects.map(formatProject);

        res.json({
            success: true,
            projects: formattedProjects
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load projects"
        });

    }

});


// ==========================================
// ADMIN - GET ALL PROJECTS
// ACTIVE + PENDING + COMPLETED
// ==========================================

router.get(
    "/admin/all",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const [projects] = await pool.query(`

                SELECT

                    c.id,
                    c.title,
                    c.category,
                    c.description,
                    c.goal,
                    c.image_url,
                    c.start_date,
                    c.deadline,
                    c.status,
                    c.created_at,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN d.status = 'completed'
                                THEN d.amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS raised

                FROM campaigns c

                LEFT JOIN donations d
                    ON d.campaign_id = c.id

                GROUP BY c.id

                ORDER BY c.created_at DESC

            `);

            const formattedProjects =
                projects.map(formatProject);

            res.json({
                success: true,
                projects: formattedProjects
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to load admin projects"
            });

        }

    }
);


// ==========================================
// GET SINGLE PROJECT
// PUBLIC
// ==========================================

router.get("/:id", async (req, res) => {

    try {

        const [projects] = await pool.query(`

            SELECT

                c.*,

                COALESCE(
                    SUM(
                        CASE
                            WHEN d.status = 'completed'
                            THEN d.amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS raised

            FROM campaigns c

            LEFT JOIN donations d
                ON d.campaign_id = c.id

            WHERE c.id = ?

            GROUP BY c.id

        `, [req.params.id]);


        if (projects.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Project not found"
            });

        }


        const project =
            formatProject(projects[0]);


        res.json({
            success: true,
            project
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load project"
        });

    }

});


// ==========================================
// ADMIN - CREATE PROJECT
// ==========================================

router.post(
    "/",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const {
                title,
                category,
                description,
                goal,
                image_url,
                start_date,
                deadline,
                status
            } = req.body;


            if (
                !title ||
                !category ||
                !description ||
                !goal
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Title, category, description and goal are required"
                });

            }


            const numericGoal =
                Number(goal);


            if (
                !Number.isFinite(numericGoal) ||
                numericGoal <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Goal amount must be greater than zero"
                });

            }


            const allowedStatuses = [
                "active",
                "pending",
                "completed"
            ];


            const safeStatus =
                allowedStatuses.includes(
                    String(status || "active").toLowerCase()
                )
                    ? String(status || "active").toLowerCase()
                    : "active";


            const [result] =
                await pool.query(

                    `INSERT INTO campaigns
                    (
                        title,
                        category,
                        description,
                        goal,
                        image_url,
                        start_date,
                        deadline,
                        status
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,

                    [
                        title.trim(),
                        category.trim(),
                        description.trim(),
                        numericGoal,
                        image_url || null,
                        start_date || null,
                        deadline || null,
                        safeStatus
                    ]

                );


            res.status(201).json({

                success: true,

                message:
                    "Project created successfully",

                projectId:
                    result.insertId

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message:
                    "Unable to create project"
            });

        }

    }

);


// ==========================================
// ADMIN - UPDATE PROJECT
// ==========================================

router.put(
    "/:id",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const {
                title,
                category,
                description,
                goal,
                image_url,
                start_date,
                deadline,
                status
            } = req.body;


            if (
                !title ||
                !category ||
                !description ||
                !goal
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Title, category, description and goal are required"

                });

            }


            const numericGoal =
                Number(goal);


            if (
                !Number.isFinite(numericGoal) ||
                numericGoal <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Goal amount must be greater than zero"

                });

            }


            const allowedStatuses = [
                "active",
                "pending",
                "completed"
            ];


            const safeStatus =
                allowedStatuses.includes(
                    String(status || "active").toLowerCase()
                )
                    ? String(status || "active").toLowerCase()
                    : "active";


            const [result] =
                await pool.query(

                    `UPDATE campaigns

                    SET

                        title = ?,
                        category = ?,
                        description = ?,
                        goal = ?,
                        image_url = ?,
                        start_date = ?,
                        deadline = ?,
                        status = ?

                    WHERE id = ?`,

                    [
                        title.trim(),
                        category.trim(),
                        description.trim(),
                        numericGoal,
                        image_url || null,
                        start_date || null,
                        deadline || null,
                        safeStatus,
                        req.params.id
                    ]

                );


            if (result.affectedRows === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Project not found"

                });

            }


            res.json({

                success: true,

                message:
                    "Project updated successfully"

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to update project"

            });

        }

    }

);


// ==========================================
// ADMIN - DELETE PROJECT
// ==========================================

router.delete(
    "/:id",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const [result] =
                await pool.query(

                    "DELETE FROM campaigns WHERE id = ?",

                    [req.params.id]

                );


            if (result.affectedRows === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Project not found"

                });

            }


            res.json({

                success: true,

                message:
                    "Project deleted successfully"

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to delete project"

            });

        }

    }

);


module.exports = router;