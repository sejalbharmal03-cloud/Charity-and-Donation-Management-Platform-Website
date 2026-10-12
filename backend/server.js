
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------
// MIDDLEWARE
// -----------------------------

app.use(
  cors({
    origin: [
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

app.use(
  express.urlencoded({
    extended: true,
  })
);

// -----------------------------
// STATIC UPLOADS
// -----------------------------

// Files are served from backend/uploads/
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// -----------------------------
// TEST ROUTE
// -----------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    project: "CareConnect",
    message: "Charity & Donation Management Platform API is running",
    version: "2.0.0",
  });
});

// -----------------------------
// API ROUTES
// -----------------------------

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const donationRoutes = require("./routes/donations");
const volunteerRoutes = require("./routes/volunteers");
const sponsorRoutes = require("./routes/sponsors");
const userRoutes = require("./routes/users");
const reportRoutes = require("./routes/reports");
const messageRoutes = require("./routes/messages");
const resourceRoutes = require("./routes/resources");

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/resources", resourceRoutes);

// -----------------------------
// 404 HANDLER
// -----------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// -----------------------------
// ERROR HANDLER
// -----------------------------

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// -----------------------------
// START SERVER
// -----------------------------

app.listen(PORT, () => {
  console.log("==========================================");
  console.log("   CARECONNECT CHARITY PLATFORM");
  console.log("==========================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("API routes ready");
  console.log("Uploads directory ready");
  console.log("==========================================");
});