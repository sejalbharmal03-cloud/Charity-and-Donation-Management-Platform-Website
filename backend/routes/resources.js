
const express = require("express");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const { authenticateToken, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

const resources = {
  documents: {
    table: "trust_documents",
    fields: [
      "title", "document_type", "registration_number",
      "description", "file_url", "issue_date", "expiry_date",
      "is_published"
    ],
    required: ["title", "document_type"],
  },
  reports: {
    table: "annual_reports",
    fields: [
      "report_year", "title", "description", "file_url", "is_published"
    ],
    required: ["report_year", "title", "file_url"],
  },
  awards: {
    table: "awards",
    fields: [
      "title", "organization", "award_year", "description",
      "photo_url", "certificate_url", "is_published"
    ],
    required: ["title"],
  },
  gallery: {
    table: "gallery_photos",
    fields: [
      "title", "description", "image_url", "event_date", "is_published"
    ],
    required: ["title", "image_url"],
  },
};

function getResource(type) {
  return resources[type] || null;
}

function fileUrl(file) {
  if (!file) return null;
  const folder = file.mimetype === "application/pdf" ? "documents" : "gallery";
  return `/uploads/${folder}/${file.filename}`;
}

function getUploadError(error, res) {
  if (error instanceof upload.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.code === "LIMIT_FILE_SIZE"
        ? "Each file must be 5 MB or smaller"
        : "Invalid upload",
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
}

// PUBLIC: published records only
router.get("/:type", async (req, res) => {
  try {
    const config = getResource(req.params.type);
    if (!config) {
      return res.status(404).json({ success: false, message: "Invalid resource type" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM ${config.table} WHERE is_published = TRUE ORDER BY created_at DESC`
    );

    res.json({ success: true, items: rows });
  } catch (error) {
    console.error("Public resources error:", error);
    res.status(500).json({ success: false, message: "Unable to load resources" });
  }
});

// ADMIN: all records, including unpublished
router.get(
  "/admin/:type",
  authenticateToken,
  adminOnly,
  async (req, res) => {
    try {
      const config = getResource(req.params.type);
      if (!config) {
        return res.status(404).json({ success: false, message: "Invalid resource type" });
      }

      const [rows] = await pool.query(
        `SELECT * FROM ${config.table} ORDER BY created_at DESC`
      );

      res.json({ success: true, items: rows });
    } catch (error) {
      console.error("Admin resources error:", error);
      res.status(500).json({ success: false, message: "Unable to load resources" });
    }
  }
);

// ADMIN: create record; upload fields: file, photo, certificate
router.post(
  "/admin/:type",
  authenticateToken,
  adminOnly,
  (req, res, next) => {
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "photo", maxCount: 1 },
      { name: "certificate", maxCount: 1 },
    ])(req, res, (error) => error ? getUploadError(error, res) : next());
  },
  async (req, res) => {
    try {
      const config = getResource(req.params.type);
      if (!config) {
        return res.status(404).json({ success: false, message: "Invalid resource type" });
      }

      const data = { ...req.body };
      const files = req.files || {};

      if (req.params.type === "documents" && files.file?.[0]) {
        data.file_url = fileUrl(files.file[0]);
      }
      if (req.params.type === "reports" && files.file?.[0]) {
        data.file_url = fileUrl(files.file[0]);
      }
      if (req.params.type === "awards") {
        if (files.photo?.[0]) data.photo_url = fileUrl(files.photo[0]);
        if (files.certificate?.[0]) data.certificate_url = fileUrl(files.certificate[0]);
      }
      if (req.params.type === "gallery" && files.photo?.[0]) {
        data.image_url = fileUrl(files.photo[0]);
      }

      if (data.is_published !== undefined) {
        data.is_published = data.is_published === "true" || data.is_published === "1";
      }

      const fields = config.fields.filter((field) => data[field] !== undefined);
      const missing = config.required.filter(
        (field) => data[field] === undefined || data[field] === ""
      );

      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Required fields: ${missing.join(", ")}`,
        });
      }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields provided" });
      }

      const values = fields.map((field) => data[field] === "" ? null : data[field]);
      const placeholders = fields.map(() => "?").join(", ");

      const [result] = await pool.query(
        `INSERT INTO ${config.table} (${fields.join(", ")}) VALUES (${placeholders})`,
        values
      );

      res.status(201).json({
        success: true,
        message: "Resource created successfully",
        id: result.insertId,
      });
    } catch (error) {
      console.error("Create resource error:", error);
      res.status(500).json({ success: false, message: "Unable to create resource" });
    }
  }
);

// ADMIN: update record
router.put(
  "/admin/:type/:id",
  authenticateToken,
  adminOnly,
  (req, res, next) => {
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "photo", maxCount: 1 },
      { name: "certificate", maxCount: 1 },
    ])(req, res, (error) => error ? getUploadError(error, res) : next());
  },
  async (req, res) => {
    try {
      const config = getResource(req.params.type);
      const id = Number(req.params.id);

      if (!config || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: "Invalid resource or ID" });
      }

      const data = { ...req.body };
      const files = req.files || {};

      if (["documents", "reports"].includes(req.params.type) && files.file?.[0]) {
        data.file_url = fileUrl(files.file[0]);
      }
      if (req.params.type === "awards") {
        if (files.photo?.[0]) data.photo_url = fileUrl(files.photo[0]);
        if (files.certificate?.[0]) data.certificate_url = fileUrl(files.certificate[0]);
      }
      if (req.params.type === "gallery" && files.photo?.[0]) {
        data.image_url = fileUrl(files.photo[0]);
      }

      if (data.is_published !== undefined) {
        data.is_published = data.is_published === "true" || data.is_published === "1";
      }

      const fields = config.fields.filter((field) => data[field] !== undefined);
      if (!fields.length) {
        return res.status(400).json({ success: false, message: "No valid fields provided" });
      }

      const values = fields.map((field) => data[field] === "" ? null : data[field]);
      const assignments = fields.map((field) => `${field} = ?`).join(", ");

      const [result] = await pool.query(
        `UPDATE ${config.table} SET ${assignments} WHERE id = ?`,
        [...values, id]
      );

      if (!result.affectedRows) {
        const [rows] = await pool.query(
          `SELECT id FROM ${config.table} WHERE id = ?`,
          [id]
        );
        if (!rows.length) {
          return res.status(404).json({ success: false, message: "Resource not found" });
        }
      }

      res.json({ success: true, message: "Resource updated successfully" });
    } catch (error) {
      console.error("Update resource error:", error);
      res.status(500).json({ success: false, message: "Unable to update resource" });
    }
  }
);

// ADMIN: delete record
router.delete(
  "/admin/:type/:id",
  authenticateToken,
  adminOnly,
  async (req, res) => {
    try {
      const config = getResource(req.params.type);
      const id = Number(req.params.id);

      if (!config || !Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: "Invalid resource or ID" });
      }

      const [result] = await pool.query(
        `DELETE FROM ${config.table} WHERE id = ?`,
        [id]
      );

      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: "Resource not found" });
      }

      res.json({ success: true, message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Delete resource error:", error);
      res.status(500).json({ success: false, message: "Unable to delete resource" });
    }
  }
);

module.exports = router;