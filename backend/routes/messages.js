const express = require("express");
const pool = require("../config/db");
const {
    authenticateToken,
    adminOnly
} = require("../middleware/auth");

const router = express.Router();


// ==========================================
// SEND MESSAGE
// ==========================================

router.post("/", async (req, res) => {

    try {

        const {
            name,
            email,
            subject,
            message
        } = req.body;


        if (!name || !email || !message) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email and message are required"

            });

        }


        await pool.query(

            `INSERT INTO messages

            (
                name,
                email,
                subject,
                message,
                status
            )

            VALUES (?, ?, ?, ?, ?)`,

            [

                name.trim(),

                email.trim().toLowerCase(),

                subject || "General Inquiry",

                message.trim(),

                "unread"

            ]

        );


        res.status(201).json({

            success: true,

            message:
                "Message sent successfully"

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Unable to send message"

        });

    }

});


// ==========================================
// ADMIN - ALL MESSAGES
// ==========================================

router.get(
    "/admin/all",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            const [messages] =
                await pool.query(`

                    SELECT *

                    FROM messages

                    ORDER BY
                        created_at DESC

                `);


            res.json({

                success: true,

                messages

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to load messages"

            });

        }

    }
);


// ==========================================
// ADMIN - MARK MESSAGE READ
// ==========================================

router.put(
    "/:id/read",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            await pool.query(

                `UPDATE messages

                 SET status='read'

                 WHERE id=?`,

                [req.params.id]

            );


            res.json({

                success: true,

                message:
                    "Message marked as read"

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to update message"

            });

        }

    }
);


// ==========================================
// ADMIN - DELETE MESSAGE
// ==========================================

router.delete(
    "/:id",
    authenticateToken,
    adminOnly,

    async (req, res) => {

        try {

            await pool.query(

                "DELETE FROM messages WHERE id=?",

                [req.params.id]

            );


            res.json({

                success: true,

                message:
                    "Message deleted"

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to delete message"

            });

        }

    }
);


module.exports = router;