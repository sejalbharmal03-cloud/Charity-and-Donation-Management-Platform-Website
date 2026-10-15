require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - Allow Render frontend and local development
app.use(
  cors({
    origin: [
      "https://charity-and-donation-management-platform-99qq.onrender.com",
      "https://charity-and-donation-management-pla.vercel.app",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// API health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    project: "CareConnect",
    message: "Charity & Donation Management Platform API is running",
    version: "2.0.0",
  });
});

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/campaigns", require("./routes/campaigns"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/volunteers", require("./routes/volunteers"));
app.use("/api/sponsors", require("./routes/sponsors"));
app.use("/api/users", require("./routes/users"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/resources", require("./routes/resources"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`CareConnect API running on port ${PORT}`);
});