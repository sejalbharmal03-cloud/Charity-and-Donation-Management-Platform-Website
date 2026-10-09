const express = require("express");

const pool = require("../config/db");

const {
    authenticateToken,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();


// ==========================================
// CREATE DONATION
// ==========================================

router.post(
    "/",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                campaign_id,
                amount,
                payment_method
            } = req.body;

            const donationAmount = Number(amount);

            if (
                !campaign_id ||
                !donationAmount ||
                donationAmount <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Valid project and donation amount are required"
                });

            }


            // Check active campaign

            const [projects] = await pool.query(
                `
                SELECT id
                FROM campaigns
                WHERE id = ?
                AND status = 'active'
                `,
                [campaign_id]
            );


            if (projects.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Project not found"
                });

            }


            // Generate transaction ID

            const transactionId =
                "CC-" +
                Date.now() +
                "-" +
                Math.floor(1000 + Math.random() * 9000);


            // Insert donation

            await pool.query(
                `
                INSERT INTO donations
                (
                    user_id,
                    campaign_id,
                    amount,
                    payment_method,
                    transaction_id,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    req.user.id,
                    campaign_id,
                    donationAmount,
                    payment_method || "Demo UPI",
                    transactionId,
                    "completed"
                ]
            );


            res.status(201).json({
                success: true,
                message: "Donation recorded successfully",
                transactionId
            });


        } catch (error) {

            console.error("CREATE DONATION ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Donation could not be completed"
            });

        }

    }
);


// ==========================================
// DONATION TREND
// ==========================================

router.get(
    "/trend",
    authenticateToken,
    async (req, res) => {

        try {

            const [trend] = await pool.query(
                `
                SELECT
                    YEAR(created_at) AS year,
                    MONTH(created_at) AS month,
                    COALESCE(SUM(amount), 0) AS total
                FROM donations
                WHERE status = 'completed'
                GROUP BY
                    YEAR(created_at),
                    MONTH(created_at)
                ORDER BY
                    YEAR(created_at),
                    MONTH(created_at)
                `
            );


            res.json({
                success: true,

                trend: trend.map((item) => {

                    return {
                        year: Number(item.year),
                        month: Number(item.month),
                        total: Number(item.total)
                    };

                })
            });


        } catch (error) {

            console.error("DONATION TREND ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load donation trend"
            });

        }

    }
);


// ==========================================
// USER DONATION HISTORY
// ==========================================

router.get(
    "/mine",
    authenticateToken,
    async (req, res) => {

        try {

            const [donations] = await pool.query(
                `
                SELECT
                    d.id,
                    d.amount,
                    d.payment_method,
                    d.transaction_id,
                    d.status,
                    d.created_at,
                    c.title AS project_title
                FROM donations d
                INNER JOIN campaigns c
                    ON c.id = d.campaign_id
                WHERE d.user_id = ?
                ORDER BY d.created_at DESC
                `,
                [req.user.id]
            );


            res.json({
                success: true,
                donations: donations
            });


        } catch (error) {

            console.error(
                "USER DONATION HISTORY ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to load donation history"
            });

        }

    }
);


// ==========================================
// ADMIN - DONATION STATS
// ==========================================

router.get(
    "/admin/stats",
    authenticateToken,
    adminOnly,
    async (req, res) => {

        try {

            const [rows] = await pool.query(
                `
                SELECT

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status = 'completed'
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalDonations,

                    COUNT(
                        CASE
                            WHEN status = 'completed'
                            THEN 1
                        END
                    ) AS donationCount,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status = 'completed'
                                AND DATE(created_at) = CURDATE()
                                THEN amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS todayAmount

                FROM donations
                `
            );


            res.json({
                success: true,

                stats: {
                    totalDonations:
                        Number(rows[0].totalDonations || 0),

                    donationCount:
                        Number(rows[0].donationCount || 0),

                    todayAmount:
                        Number(rows[0].todayAmount || 0)
                }
            });


        } catch (error) {

            console.error("DONATION STATS ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load donation stats"
            });

        }

    }
);


// ==========================================
// ADMIN - ALL DONATIONS
// ==========================================

router.get(
    "/admin/all",
    authenticateToken,
    adminOnly,
    async (req, res) => {

        try {

            const [donations] = await pool.query(
                `
                SELECT
                    d.id,
                    d.amount,
                    d.payment_method,
                    d.transaction_id,
                    d.status,
                    d.created_at,
                    u.name AS donor_name,
                    u.email AS donor_email,
                    c.title AS project_title
                FROM donations d
                INNER JOIN users u
                    ON u.id = d.user_id
                INNER JOIN campaigns c
                    ON c.id = d.campaign_id
                ORDER BY d.created_at DESC
                `
            );


            res.json({
                success: true,
                donations: donations
            });


        } catch (error) {

            console.error("ADMIN DONATIONS ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load donations"
            });

        }

    }
);


// ==========================================
// ADMIN - UPDATE DONATION STATUS
// ==========================================

router.put(
    "/admin/:id/status",
    authenticateToken,
    adminOnly,
    async (req, res) => {

        try {

            const { status } = req.body;

            const allowedStatuses = [
                "pending",
                "completed",
                "failed"
            ];


            if (!allowedStatuses.includes(status)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid donation status"
                });

            }


            const [result] = await pool.query(
                `
                UPDATE donations
                SET status = ?
                WHERE id = ?
                `,
                [
                    status,
                    req.params.id
                ]
            );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Donation not found"
                });

            }


            res.json({
                success: true,
                message: "Donation status updated successfully"
            });


        } catch (error) {

            console.error(
                "UPDATE DONATION STATUS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to update donation status"
            });

        }

    }
);


// ==========================================
// ADMIN - DELETE DONATION
// ==========================================

router.delete(
    "/admin/:id",
    authenticateToken,
    adminOnly,
    async (req, res) => {

        try {

            const [result] = await pool.query(
                `
                DELETE FROM donations
                WHERE id = ?
                `,
                [req.params.id]
            );


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Donation not found"
                });

            }


            res.json({
                success: true,
                message: "Donation deleted successfully"
            });


        } catch (error) {

            console.error(
                "DELETE DONATION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Unable to delete donation"
            });

        }

    }
);


// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;