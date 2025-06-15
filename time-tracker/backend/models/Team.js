const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canCreateProjects: {
        type: Boolean,
        default: false
      },
      canManageTeam: {
        type: Boolean,
        default: false
      },
      canViewReports: {
        type: Boolean,
        default: true
      },
      canManageTasks: {
        type: Boolean,
        default: false
      }
    }
  }],
  invitations: [{
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member'],
      default: 'member'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    },
    token: {
      type: String,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Set permissions based on role
teamSchema.pre('save', function(next) {
  this.members.forEach(member => {
    switch (member.role) {
      case 'admin':
        member.permissions = {
          canCreateProjects: true,
          canManageTeam: true,
          canViewReports: true,
          canManageTasks: true
        };
        break;
      case 'manager':
        member.permissions = {
          canCreateProjects: true,
          canManageTeam: false,
          canViewReports: true,
          canManageTasks: true
        };
        break;
      case 'member':
        member.permissions = {
          canCreateProjects: false,
          canManageTeam: false,
          canViewReports: true,
          canManageTasks: false
        };
        break;
    }
  });
  next();
});

module.exports = mongoose.model('Team', teamSchema);
