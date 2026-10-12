const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();


// =====================================================
// CREATE JWT TOKEN
// =====================================================
console.log("JWT_SECRET loaded:", Boolean(process.env.JWT_SECRET));
function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
}


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {
    try {

        const {
            name,
            email,
            password,
            phone
        } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone ? phone.trim() : null;

        // Check existing user
        const [existingUser] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create normal user
        const [result] = await pool.query(
            `INSERT INTO users
            (name, email, password, phone, role)
            VALUES (?, ?, ?, ?, ?)`,
            [
                cleanName,
                cleanEmail,
                hashedPassword,
                cleanPhone,
                "user"
            ]
        );

        const user = {
            id: result.insertId,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            role: "user"
        };

        const token = createToken(user);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token: token,
            user: user
        });

    } catch (error) {

        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", async (req, res) => {
    try {

        const {
    email,
    password
} = req.body || {};

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user
        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Safe user object
        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        };

        // Create JWT
        const token = createToken(safeUser);

        return res.json({
            success: true,
            message: "Login successful",
            token: token,
            user: safeUser
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;