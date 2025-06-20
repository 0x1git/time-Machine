const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Organization = require("../models/Organization");
const Team = require("../models/Team");
const { auth } = require("../middleware/auth");
const { verifyOTPFromDB } = require("../utils/otpUtils");
const emailService = require("../services/emailService");

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @route   POST /api/auth/register
// @desc    Register user (requires email verification)
// @access  Public
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("companyName").optional(),
    body("invitationToken").optional(),
    body("otp").optional(),
    body("emailVerified").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        email,
        password,
        companyName,
        invitationToken,
        emailVerified,
      } = req.body;

      // Check if email verification is required
      if (!emailVerified) {
        return res.status(400).json({
          message:
            "Email verification required. Please verify your email first.",
        });
      }

      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      let organization;
      let userRole = "admin"; // Default role for new organization creators
      let teamToJoin = null;
      let invitation = null;

      // Check if this is a registration from a team invitation
      if (invitationToken) {
        // Find the team and invitation
        const team = await Team.findOne({
          "invitations.token": invitationToken,
          "invitations.status": "pending",
        }).populate("organization");

        if (team) {
          invitation = team.invitations.find(
            (inv) => inv.token === invitationToken && inv.status === "pending"
          );

          if (
            invitation &&
            invitation.email === email &&
            new Date() <= invitation.expiresAt
          ) {
            // Valid invitation - use the organization from the invitation
            organization = team.organization;
            userRole = invitation.role;
            teamToJoin = team;
            console.log(
              `Registration via invitation: ${email} joining ${organization.name} as ${userRole}`
            );
          }
        }
      }

      // If no valid invitation, create new organization (original flow)
      if (!organization) {
        if (!companyName) {
          return res.status(400).json({
            message: "Company name is required when not joining via invitation",
          });
        }

        // Generate unique slug for organization
        let baseSlug = companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        let slug = baseSlug;
        let counter = 1;

        while (await Organization.findOne({ slug })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        // Create new organization
        organization = new Organization({
          name: companyName,
          slug: slug,
          createdBy: null, // Will be set after user creation
        });
      }

      // Create user with email verified
      user = new User({
        name,
        email,
        password,
        role: userRole,
        organization: organization._id,
        isEmailVerified: true,
        emailVerificationRequired: false,
      });

      // Save user first
      await user.save();

      // If this is a new organization, set the creator
      if (!invitationToken) {
        organization.createdBy = user._id;
        await organization.save();
      }

      // If user joined via invitation, add them to the team and mark invitation as accepted
      if (teamToJoin && invitation) {
        // Add user to team
        teamToJoin.members.push({
          user: user._id,
          role: invitation.role,
        });

        // Mark invitation as accepted
        invitation.status = "accepted";

        await teamToJoin.save();
        console.log(`Added ${email} to team ${teamToJoin.name}`);
      }

      // Generate token
      const token = generateToken(user._id);

      // Get populated user data
      const populatedUser = await User.findById(user._id).populate(
        "organization"
      );

      res.status(201).json({
        token,
        user: {
          id: populatedUser._id,
          name: populatedUser.name,
          email: populatedUser.email,
          role: populatedUser.role,
          organization: populatedUser.organization._id,
          permissions: populatedUser.permissions,
        },
        organization: {
          id: populatedUser.organization._id,
          name: populatedUser.organization.name,
          slug: populatedUser.organization.slug,
        },
        message: invitationToken
          ? "Account created and joined team successfully"
          : "Account and organization created successfully",
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (with optional 2FA)
// @access  Public
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
    body("otp")
      .optional()
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
    body("require2FA").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, otp, require2FA } = req.body;

      // Check for user
      const user = await User.findOne({ email }).populate("organization");
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(400).json({
          message:
            "Email not verified. Please verify your email before logging in.",
          requireEmailVerification: true,
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // If 2FA is required but no OTP provided, ask for OTP
      if (require2FA && !otp) {
        return res.status(200).json({
          message: "Please provide the OTP sent to your email",
          require2FA: true,
          email: email,
        });
      }

      // If OTP is provided, verify it
      if (otp) {
        const otpVerification = await verifyOTPFromDB(email, otp, "login_2fa");
        if (!otpVerification.success) {
          return res.status(400).json({
            message: "Login verification failed: " + otpVerification.message,
          });
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization ? user.organization._id : null,
          permissions: user.permissions,
          isEmailVerified: user.isEmailVerified,
        },
        organization: user.organization
          ? {
              id: user.organization._id,
              name: user.organization.name,
              slug: user.organization.slug,
            }
          : null,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP to user's email
// @access  Public
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Please include a valid email")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found with this email address" });
      }      // Generate OTP for password reset
      const { createOTP } = require('../utils/otpUtils');
      const otpResult = await createOTP(email, 'password_reset');

      // Send password reset email
      await emailService.sendPasswordResetOTP(email, user.name, otpResult.otp);

      res.json({
        message: "Password reset code sent to your email address",
        email: email
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Server error occurred" });
    }
  }
);

// @route   POST /api/auth/verify-reset-otp
// @desc    Verify password reset OTP
// @access  Public
router.post(
  "/verify-reset-otp",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp } = req.body;

      // Verify OTP
      const otpVerification = await verifyOTPFromDB(email, otp, 'password_reset');
      
      if (!otpVerification.success) {
        return res.status(400).json({ message: otpVerification.message });
      }

      // Generate a temporary token for password reset (valid for 10 minutes)
      const resetToken = jwt.sign(
        { email, purpose: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      res.json({
        message: "OTP verified successfully",
        resetToken: resetToken
      });
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      res.status(500).json({ message: "Server error occurred" });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token and new password
// @access  Public
router.post(
  "/reset-password",
  [
    body("resetToken").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { resetToken, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'password_reset') {
          return res.status(400).json({ message: "Invalid reset token" });
        }
      } catch (error) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Find user and update password
      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update password (will be hashed by the pre-save middleware)
      user.password = newPassword;
      await user.save();

      // Clean up any existing password reset OTPs for this email
      const OTP = require('../models/OTP');
      await OTP.deleteMany({ email: decoded.email, type: 'password_reset' });

      res.json({
        message: "Password reset successfully"
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Server error occurred" });
    }
  }
);

module.exports = router;
