const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../Config/database");
const env = require("../Config/env.js");
const { authenticateToken, requireRole } = require("../middleware/auth");

// ✅ Admin Registration (only superadmin can create new admins)
router.post(
  "/register",
  authenticateToken,
  requireRole("superadmin", "super_admin"),
  async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingAdmin = await prisma.admin.findFirst({
        where: { OR: [{ username }, { email }] },
      });

      if (existingAdmin) {
        return res.status(400).json({ error: "Admin already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const admin = await prisma.admin.create({
        data: {
          username,
          email,
          password: hashedPassword,
          role: role || "admin",
        },
      });

      res.status(201).json({
        message: "Admin created successfully",
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Admin Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!admin) return res.status(401).json({ error: "Invalid credentials" });

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, role: true },
    });

    res.json({ admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id: req.user.id } });
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.admin.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get all admins (only superadmin)
router.get("/", authenticateToken, requireRole("superadmin", "super_admin"), async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
