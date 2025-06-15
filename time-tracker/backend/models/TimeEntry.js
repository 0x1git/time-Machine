const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
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
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
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
    min: 0
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  billable: {
    type: Boolean,
    default: true
  },  tags: [{
    type: String,
    trim: true
  }],
  breaks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Break'
  }],
  totalBreakTime: {
    type: Number, // in seconds
    default: 0,
    min: 0
  },
  isOnBreak: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ project: 1, startTime: -1 });
timeEntrySchema.index({ task: 1, startTime: -1 });

// Calculate duration if endTime is set
timeEntrySchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    this.isRunning = false;
  }
  next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
