const fs = require("fs");
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
    ca: fs.readFileSync(__dirname + "/ca.pem"),
    rejectUnauthorized: true
},

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        console.log("✅ MySQL Cloud Database Connected");
        connection.release();
    })
    .catch(error => {
        console.error("❌ Database Connection Failed:");
        console.error(error.message);
    });

module.exports = pool;