const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const OTP = require("../models/OTP");

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP before storing
 */
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

/**
 * Verify OTP against stored hash
 */
const verifyOTP = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

/**
 * Create and store OTP in database
 */
const createOTP = async (email, type) => {
  try {
    // Delete any existing OTPs for this email and type
    await OTP.deleteMany({ email, type });

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    // Create OTP record
    const otpRecord = new OTP({
      email,
      otpHash,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await otpRecord.save();

    return {
      otp, // Return plain OTP for sending via email
      otpRecord,
    };
  } catch (error) {
    throw new Error("Failed to create OTP: " + error.message);
  }
};

/**
 * Verify OTP from user input
 */
const verifyOTPFromDB = async (email, otp, type) => {
  try {
    // Find the most recent OTP for this email and type
    const otpRecord = await OTP.findOne({
      email,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return {
        success: false,
        message: "Invalid or expired OTP",
      };
    }

    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 3) {
      return {
        success: false,
        message: "Maximum verification attempts exceeded",
      };
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP
    const isValid = await verifyOTP(otp, otpRecord.otpHash);

    if (!isValid) {
      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    return {
      success: true,
      message: "OTP verified successfully",
      otpRecord,
    };
  } catch (error) {
    throw new Error("Failed to verify OTP: " + error.message);
  }
};

/**
 * Clean up expired OTPs (optional - MongoDB TTL will handle this automatically)
 */
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
  } catch (error) {
    console.error("Failed to cleanup expired OTPs:", error);
  }
};

/**
 * Check if user can request new OTP (rate limiting)
 */
const canRequestOTP = async (email, type) => {
  try {
    // Check if there's a recent OTP request (within last 1 minute)
    const recentOTP = await OTP.findOne({
      email,
      type,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) }, // 1 minute ago
    });

    if (recentOTP) {
      const timeLeft = Math.ceil(
        (60 * 1000 - (Date.now() - recentOTP.createdAt)) / 1000
      );
      return {
        canRequest: false,
        message: `Please wait ${timeLeft} seconds before requesting a new OTP`,
      };
    }

    // Check daily limit (max 5 OTPs per day per email)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOTPs = await OTP.countDocuments({
      email,
      type,
      createdAt: { $gte: today },
    });

    if (todayOTPs >= 5) {
      return {
        canRequest: false,
        message: "Daily OTP limit exceeded. Please try again tomorrow.",
      };
    }

    return {
      canRequest: true,
    };
  } catch (error) {
    throw new Error("Failed to check OTP rate limit: " + error.message);
  }
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  createOTP,
  verifyOTPFromDB,
  cleanupExpiredOTPs,
  canRequestOTP,
};
