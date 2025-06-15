const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeEntry',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  breakType: {
    type: String,
    enum: ['lunch', 'coffee', 'personal', 'meeting', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPaid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
breakSchema.index({ user: 1, startTime: -1 });
breakSchema.index({ timeEntry: 1, startTime: -1 });
breakSchema.index({ project: 1, startTime: -1 });
breakSchema.index({ isActive: 1 });

// Calculate duration if endTime is set
breakSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    this.isActive = false;
  }
  next();
});

module.exports = mongoose.model('Break', breakSchema);
