const express = require("express");
const { body, validationResult } = require("express-validator");
const {
  createOTP,
  verifyOTPFromDB,
  canRequestOTP,
} = require("../utils/otpUtils");
const emailService = require("../services/emailService");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Rate limiting middleware for OTP routes
const otpRateLimit = {};

const checkRateLimit = (req, res, next) => {
  const { email } = req.body;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 2; // Max 2 requests per minute per email

  if (!otpRateLimit[email]) {
    otpRateLimit[email] = [];
  }

  // Clean old requests
  otpRateLimit[email] = otpRateLimit[email].filter(
    (time) => now - time < windowMs
  );

  if (otpRateLimit[email].length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: "Too many OTP requests. Please wait before trying again.",
    });
  }

  otpRateLimit[email].push(now);
  next();
};

// @route   POST /api/otp/send-verification
// @desc    Send email verification OTP
// @access  Public
router.post(
  "/send-verification",
  [
    checkRateLimit,
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("name").optional().trim(),
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

      const { email, name } = req.body;

      // Check if user already exists and is verified
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      // Check rate limiting
      const rateLimitCheck = await canRequestOTP(email, "email_verification");
      if (!rateLimitCheck.canRequest) {
        return res.status(429).json({
          success: false,
          message: rateLimitCheck.message,
        });
      }

      // Create OTP
      const { otp, otpRecord } = await createOTP(email, "email_verification");

      // Send OTP email
      try {
        await emailService.sendEmailVerificationOTP(email, otp, name);
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        // Continue even if email fails - user might check logs
      }

      res.status(200).json({
        success: true,
        message: "Verification code sent to your email",
        expiresAt: otpRecord.expiresAt,
      });
    } catch (error) {
      console.error("Send verification OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send verification code",
      });
    }
  }
);

// @route   POST /api/otp/verify-email
// @desc    Verify email with OTP
// @access  Public
router.post(
  "/verify-email",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
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

      const { email, otp } = req.body;

      // Verify OTP
      const verification = await verifyOTPFromDB(
        email,
        otp,
        "email_verification"
      );

      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message,
        });
      }

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Verify email OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify email",
      });
    }
  }
);

// @route   POST /api/otp/send-login
// @desc    Send login 2FA OTP
// @access  Public
router.post(
  "/send-login",
  [
    checkRateLimit,
    body("email").isEmail().withMessage("Please provide a valid email"),
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

      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.status(200).json({
          success: true,
          message: "If the email exists, a verification code has been sent",
        });
      }

      // Check rate limiting
      const rateLimitCheck = await canRequestOTP(email, "login_2fa");
      if (!rateLimitCheck.canRequest) {
        return res.status(429).json({
          success: false,
          message: rateLimitCheck.message,
        });
      }

      // Create OTP
      const { otp, otpRecord } = await createOTP(email, "login_2fa");

      // Send OTP email
      try {
        await emailService.sendLoginOTP(email, otp, user.name);
      } catch (emailError) {
        console.error("Failed to send login OTP email:", emailError);
        // Continue even if email fails
      }

      res.status(200).json({
        success: true,
        message: "Verification code sent to your email",
        expiresAt: otpRecord.expiresAt,
      });
    } catch (error) {
      console.error("Send login OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send verification code",
      });
    }
  }
);

// @route   POST /api/otp/verify-login
// @desc    Verify login OTP
// @access  Public
router.post(
  "/verify-login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
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

      const { email, otp } = req.body;

      // Check if user exists
      const user = await User.findOne({ email }).populate("organization");
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Verify OTP
      const verification = await verifyOTPFromDB(email, otp, "login_2fa");

      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message,
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token (you'll need to import this from your auth route)
      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          permissions: user.permissions,
        },
      });
    } catch (error) {
      console.error("Verify login OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify login",
      });
    }
  }
);

// @route   POST /api/otp/resend
// @desc    Resend OTP
// @access  Public
router.post(
  "/resend",
  [
    checkRateLimit,
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("type")
      .isIn(["email_verification", "login_2fa"])
      .withMessage("Invalid OTP type"),
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

      const { email, type } = req.body;

      // Check rate limiting
      const rateLimitCheck = await canRequestOTP(email, type);
      if (!rateLimitCheck.canRequest) {
        return res.status(429).json({
          success: false,
          message: rateLimitCheck.message,
        });
      }

      // Create new OTP
      const { otp, otpRecord } = await createOTP(email, type);

      // Send OTP email
      try {
        if (type === "email_verification") {
          await emailService.sendEmailVerificationOTP(email, otp);
        } else {
          const user = await User.findOne({ email });
          await emailService.sendLoginOTP(email, otp, user?.name);
        }
      } catch (emailError) {
        console.error("Failed to resend OTP email:", emailError);
      }

      res.status(200).json({
        success: true,
        message: "New verification code sent to your email",
        expiresAt: otpRecord.expiresAt,
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resend verification code",
      });
    }
  }
);

module.exports = router;
