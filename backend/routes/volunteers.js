const express = require("express");
const pool = require("../config/db");
const {
    authenticateToken,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();


// ==========================================
// REGISTER VOLUNTEER
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            interest,
            availability
        } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: "Name, email and phone are required"
            });
        }

        await pool.query(
            `INSERT INTO volunteers
            (name, email, phone, interest, availability, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                interest || null,
                availability || null,
                "pending"
            ]
        );

        res.status(201).json({
            success: true,
            message: "Volunteer registration submitted successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Volunteer registration failed"
        });

    }

});


// ==========================================
// ADMIN - GET ALL VOLUNTEERS
// ==========================================

router.get(
    "/admin/all",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const [volunteers] = await pool.query(`
                SELECT *
                FROM volunteers
                ORDER BY created_at DESC
            `);

            res.json({
                success: true,
                volunteers
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to load volunteers"
            });

        }

    }
);


// ==========================================
// ADMIN - UPDATE VOLUNTEER STATUS
// ==========================================

router.put(
    "/:id",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const { status } = req.body;

            const allowedStatuses = [
                "pending",
                "approved",
                "rejected",
                "inactive"
            ];

            if (!allowedStatuses.includes(status)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid volunteer status"
                });

            }

            await pool.query(
                "UPDATE volunteers SET status=? WHERE id=?",
                [status, req.params.id]
            );

            res.json({
                success: true,
                message: "Volunteer status updated"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to update volunteer"
            });

        }

    }
);


// ==========================================
// ADMIN - DELETE VOLUNTEER
// ==========================================

router.delete(
    "/:id",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            await pool.query(
                "DELETE FROM volunteers WHERE id=?",
                [req.params.id]
            );

            res.json({
                success: true,
                message: "Volunteer deleted successfully"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to delete volunteer"
            });

        }

    }
);


module.exports = router;