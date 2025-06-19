const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth, authorize, requirePermission } = require("../middleware/auth");
const { requireOrganization } = require("../middleware/organization");
const { verifyOTPFromDB } = require("../utils/otpUtils");

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users in organization (admin/manager with permission)
// @access  Private
router.get(
  "/",
  [auth, requireOrganization, requirePermission("canViewAllUsers")],
  async (req, res) => {
    try {
      const users = await User.find({
        organization: req.organizationId,
        isActive: true,
      })
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET /api/users/me
// @desc    Get current user profile with permissions
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("organization");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure permissions are set based on current role
    if (
      !user.permissions ||
      Object.keys(user.permissions.toObject()).length === 0
    ) {
      // If user doesn't have permissions set, trigger the pre-save middleware
      user.markModified("role");
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put("/me", auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/users/search
// @desc    Search users by email or name within organization
// @access  Private
router.get("/search", [auth, requireOrganization], async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters" });
    }

    const users = await User.find({
      $and: [
        { organization: req.organizationId },
        { isActive: true },
        { _id: { $ne: req.user.id } }, // Exclude current user
        {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        },
      ],
    })
      .select("name email avatar")
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password with OTP verification
// @access  Private
router.put(
  "/change-password",
  [
    auth,
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword, otp } = req.body;

      // Get current user
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Verify OTP
      const otpVerification = await verifyOTPFromDB(
        user.email,
        otp,
        "login_2fa"
      );
      if (!otpVerification.success) {
        return res.status(400).json({
          success: false,
          message: "OTP verification failed: " + otpVerification.message,
        });
      }

      // Update password (will be hashed by pre-save middleware)
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to change password",
      });
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    // Users can only update their own profile, unless they're admin
    if (req.params.id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, avatar } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.avatar = avatar || user.avatar;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (admin only)
// @access  Private/Admin
router.put("/:id/role", [auth, authorize("admin")], async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "manager", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/users/me
// @desc    Delete current user's account (soft delete)
// @access  Private
router.delete("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`; // Prevent email conflicts
    await user.save();

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/users/:id
// @desc    Deactivate user (admin only)
// @access  Private/Admin
router.delete("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: "User deactivated" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
