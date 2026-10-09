const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// Submit feedback
router.post("/", async (req, res) => {
    try {
        const { name, email, message, rating } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email and message are required"
            });
        }

        let cleanRating = null;

        if (rating !== undefined && rating !== null && rating !== "") {
            cleanRating = Number(rating);

            if (
                Number.isNaN(cleanRating) ||
                cleanRating < 1 ||
                cleanRating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be between 1 and 5"
                });
            }
        }

        const [result] = await pool.query(
            `INSERT INTO feedback
            (name, email, message, rating)
            VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
                email.trim().toLowerCase(),
                message.trim(),
                cleanRating
            ]
        );

        res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            feedbackId: result.insertId
        });

    } catch (error) {
        console.error("Feedback Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to submit feedback"
        });
    }
});

module.exports = router;