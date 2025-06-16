const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3498db'
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
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamRole: {
      type: String,
      enum: ['admin', 'manager', 'member'],
      required: true
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
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  deadline: {
    type: Date
  },
  budget: {
    type: Number
  },
  currency: {
    type: String,
    default: 'USD'
  }
}, {
  timestamps: true
});

// Index for faster queries
projectSchema.index({ owner: 1, isActive: 1 });
projectSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Project', projectSchema);
