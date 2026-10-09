
const express = require("express");
const pool = require("../config/db");
const {
    authenticateToken,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();

// ADD SPONSOR
router.post("/", authenticateToken, adminOnly, async (req, res) => {
    try {
        const {
            name,
            company,
            email,
            phone,
            contribution,
            website,
            sponsored_project,
            sponsorship_date
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Sponsor name and email are required"
            });
        }

        await pool.query(
            `INSERT INTO sponsors
            (name, company, email, phone, contribution, website,
             sponsored_project, sponsorship_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                company || null,
                email.trim().toLowerCase(),
                phone || null,
                Number(contribution) || 0,
                website || null,
                sponsored_project || null,
                sponsorship_date || null,
                "active"
            ]
        );

        res.status(201).json({
            success: true,
            message: "Sponsor added successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Unable to add sponsor"
        });
    }
});

// GET ALL SPONSORS
router.get("/admin/all", authenticateToken, adminOnly, async (req, res) => {
    try {
        const [sponsors] = await pool.query(`
            SELECT *
            FROM sponsors
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            sponsors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Unable to load sponsors"
        });
    }
});

// UPDATE SPONSOR
router.put("/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
        const {
            name,
            company,
            email,
            phone,
            contribution,
            website,
            sponsored_project,
            sponsorship_date,
            status
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Sponsor name and email are required"
            });
        }

        await pool.query(
            `UPDATE sponsors
             SET name = ?,
                 company = ?,
                 email = ?,
                 phone = ?,
                 contribution = ?,
                 website = ?,
                 sponsored_project = ?,
                 sponsorship_date = ?,
                 status = ?
             WHERE id = ?`,
            [
                name.trim(),
                company || null,
                email.trim().toLowerCase(),
                phone || null,
                Number(contribution) || 0,
                website || null,
                sponsored_project || null,
                sponsorship_date || null,
                status || "active",
                req.params.id
            ]
        );

        res.json({
            success: true,
            message: "Sponsor updated successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Unable to update sponsor"
        });
    }
});

// DELETE SPONSOR
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM sponsors WHERE id = ?",
            [req.params.id]
        );

        res.json({
            success: true,
            message: "Sponsor deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Unable to delete sponsor"
        });
    }
});

module.exports = router;