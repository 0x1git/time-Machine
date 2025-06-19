const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationRequired: {
      type: Boolean,
      default: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      // Note: required for existing users, but handled in registration logic
    },
    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: "admin", // Changed: New users are admin by default
    },
    permissions: {
      // User management
      canManageUsers: { type: Boolean, default: false },
      canViewAllUsers: { type: Boolean, default: false },
      canEditUserRoles: { type: Boolean, default: false },

      // Project management
      canManageAllProjects: { type: Boolean, default: false },
      canCreateProjects: { type: Boolean, default: false },
      canEditOwnProjects: { type: Boolean, default: true },
      canDeleteProjects: { type: Boolean, default: false },
      canViewAllProjects: { type: Boolean, default: false },

      // Task management
      canManageAllTasks: { type: Boolean, default: false },
      canCreateTasks: { type: Boolean, default: true },
      canEditOwnTasks: { type: Boolean, default: true },
      canDeleteTasks: { type: Boolean, default: false },

      // Time tracking
      canViewAllTimeEntries: { type: Boolean, default: false },
      canEditAllTimeEntries: { type: Boolean, default: false },
      canDeleteTimeEntries: { type: Boolean, default: false },
      canManageBreaks: { type: Boolean, default: true },

      // Team management
      canManageTeams: { type: Boolean, default: false },
      canInviteUsers: { type: Boolean, default: false },
      canAssignRoles: { type: Boolean, default: false },

      // Reports and analytics
      canViewAllReports: { type: Boolean, default: false },
      canViewTeamReports: { type: Boolean, default: false },
      canExportReports: { type: Boolean, default: false },

      // System settings
      canManageSettings: { type: Boolean, default: false },
      canAccessKiosk: { type: Boolean, default: false },
    },
    avatar: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
userSchema.pre("save", function (next) {
  if (this.isModified("role") || this.isNew) {
    const permissions = getPermissionsByRole(this.role);
    this.permissions = { ...this.permissions.toObject(), ...permissions };
  }
  next();
});

// Helper function to get permissions by role
function getPermissionsByRole(role) {
  const permissions = {};

  switch (role) {
    case "admin":
      // Admin has all permissions
      return {
        canManageUsers: true,
        canViewAllUsers: true,
        canEditUserRoles: true,
        canManageAllProjects: true,
        canCreateProjects: true,
        canEditOwnProjects: true,
        canDeleteProjects: true,
        canViewAllProjects: true,
        canManageAllTasks: true,
        canCreateTasks: true,
        canEditOwnTasks: true,
        canDeleteTasks: true,
        canViewAllTimeEntries: true,
        canEditAllTimeEntries: true,
        canDeleteTimeEntries: true,
        canManageBreaks: true,
        canManageTeams: true,
        canInviteUsers: true,
        canAssignRoles: true,
        canViewAllReports: true,
        canViewTeamReports: true,
        canExportReports: true,
        canManageSettings: true,
        canAccessKiosk: true,
      };

    case "manager":
      // Manager has team-level permissions
      return {
        canManageUsers: false,
        canViewAllUsers: true,
        canEditUserRoles: false,
        canManageAllProjects: false,
        canCreateProjects: true,
        canEditOwnProjects: true,
        canDeleteProjects: false,
        canViewAllProjects: true,
        canManageAllTasks: false,
        canCreateTasks: true,
        canEditOwnTasks: true,
        canDeleteTasks: false,
        canViewAllTimeEntries: true,
        canEditAllTimeEntries: false,
        canDeleteTimeEntries: false,
        canManageBreaks: true,
        canManageTeams: true,
        canInviteUsers: true,
        canAssignRoles: false,
        canViewAllReports: true,
        canViewTeamReports: true,
        canExportReports: true,
        canManageSettings: false,
        canAccessKiosk: true,
      };
    case "member":
    default:
      // Member has basic permissions plus some additional access
      return {
        canManageUsers: false,
        canViewAllUsers: true, // Updated: Members can now view all users
        canEditUserRoles: false,
        canManageAllProjects: false,
        canCreateProjects: false,
        canEditOwnProjects: true,
        canDeleteProjects: false,
        canViewAllProjects: false,
        canManageAllTasks: false,
        canCreateTasks: true,
        canEditOwnTasks: true,
        canDeleteTasks: false,
        canViewAllTimeEntries: true, // Updated: Members can now view all time entries
        canEditAllTimeEntries: false,
        canDeleteTimeEntries: false,
        canManageBreaks: true,
        canManageTeams: false,
        canInviteUsers: false,
        canAssignRoles: false,
        canViewAllReports: false,
        canViewTeamReports: true, // Updated: Members can now view team reports
        canExportReports: false,
        canManageSettings: false,
        canAccessKiosk: true, // Updated: Members can now access kiosk
      };
  }
}

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model("User", userSchema);
