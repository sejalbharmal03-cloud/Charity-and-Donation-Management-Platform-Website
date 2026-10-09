const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const {
    authenticateToken,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();


// ==========================================
// CURRENT USER
// ==========================================

router.get(
    "/me",
    authenticateToken,

    async (req, res) => {

        try {

            const [users] = await pool.query(
                `SELECT
                    id,
                    name,
                    email,
                    phone,
                    role,
                    created_at
                 FROM users
                 WHERE id=?`,
                [req.user.id]
            );

            if (!users.length) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }

            res.json({
                success: true,
                user: users[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to load profile"
            });

        }

    }
);


// ==========================================
// UPDATE CURRENT USER PROFILE
// ==========================================

router.put(
    "/me",
    authenticateToken,
    async (req, res) => {
        try {
            const { name, email, phone } = req.body;

            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: "Name and email are required"
                });
            }

            const cleanName = name.trim();
            const cleanEmail = email.trim().toLowerCase();
            const cleanPhone = phone ? phone.trim() : null;

            if (!cleanName || !cleanEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Name and email cannot be empty"
                });
            }

            // Check whether another user already uses this email
            const [existingUsers] = await pool.query(
                `SELECT id FROM users
                 WHERE email = ? AND id != ?`,
                [cleanEmail, req.user.id]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already registered"
                });
            }

            await pool.query(
                `UPDATE users
                 SET name = ?, email = ?, phone = ?
                 WHERE id = ?`,
                [cleanName, cleanEmail, cleanPhone, req.user.id]
            );

            const [updatedUsers] = await pool.query(
                `SELECT id, name, email, phone, role, created_at
                 FROM users
                 WHERE id = ?`,
                [req.user.id]
            );

            return res.json({
                success: true,
                message: "Profile updated successfully",
                user: updatedUsers[0]
            });
        } catch (error) {
            console.error("Update profile error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update profile"
            });
        }
    }
);


/* ==========================================
   CHANGE CURRENT USER PASSWORD
========================================== */

router.put(
    "/change-password",
    authenticateToken,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body || {};

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Current and new passwords are required"
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "New password must contain at least 8 characters"
                });
            }

            const [users] = await pool.query(
                "SELECT password FROM users WHERE id = ? LIMIT 1",
                [req.user.id]
            );

            if (!users.length) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            const passwordMatches = await bcrypt.compare(
                currentPassword,
                users[0].password
            );

            if (!passwordMatches) {
                return res.status(400).json({
                    success: false,
                    message: "Current password is incorrect"
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await pool.query(
                "UPDATE users SET password = ? WHERE id = ?",
                [hashedPassword, req.user.id]
            );

            return res.json({
                success: true,
                message: "Password changed successfully"
            });
        } catch (error) {
            console.error("Change password error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to change password"
            });
        }
    }
);

// ==========================================
// ADMIN - ALL USERS
// ==========================================

router.get(
    "/admin/all",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const [users] = await pool.query(`
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    role,
                    created_at
                FROM users
                ORDER BY created_at DESC
            `);

            res.json({
                success: true,
                users
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to load users"
            });

        }

    }
);


// ==========================================
// ADMIN DASHBOARD OVERVIEW
// ==========================================

router.get(
    "/admin/overview",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const [[users]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM users
            `);

            const [[projects]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM campaigns
            `);

            // ACTIVE CAMPAIGNS
            const [[activeCampaigns]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM campaigns
                WHERE status = 'active'
            `);

            const [[volunteers]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM volunteers
                WHERE status='approved'
            `);

            const [[sponsors]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM sponsors
                WHERE status='active'
            `);

            const [[donations]] = await pool.query(`
                SELECT
                    COUNT(*) AS donation_count,
                    COALESCE(SUM(amount),0) AS total_amount
                FROM donations
                WHERE status='completed'
            `);

            // PENDING DONATIONS
            const [[pendingDonations]] = await pool.query(`
                SELECT COUNT(*) AS total
                FROM donations
                WHERE status = 'pending'
            `);

            res.json({

                success: true,

                overview: {

                    totalUsers:
                        Number(users.total),

                    totalProjects:
                        Number(projects.total),

                    activeCampaigns:
                        Number(activeCampaigns.total),

                    totalVolunteers:
                        Number(volunteers.total),

                    totalSponsors:
                        Number(sponsors.total),

                    totalDonations:
                        Number(donations.total_amount),

                    donationCount:
                        Number(donations.donation_count),

                    pendingDonations:
                        Number(pendingDonations.total)

                }

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to load dashboard overview"
            });

        }

    }
);


// ==========================================
// ADMIN - DELETE USER
// ==========================================

router.delete(
    "/admin/:id",
    authenticateToken,
    adminOnly,
    async (req, res) => {
        try {
            const userId = Number(req.params.id);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }

            // Prevent deleting the currently logged-in admin
            if (userId === Number(req.user.id)) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot delete your own account"
                });
            }

            const [result] = await pool.query(
                "DELETE FROM users WHERE id = ?",
                [userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            return res.json({
                success: true,
                message: "User deleted successfully"
            });
        } catch (error) {
            console.error("Delete user error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete user"
            });
        }
    }
);

module.exports = router;