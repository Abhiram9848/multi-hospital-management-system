const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String
  }
});

const scheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availableHours: {
    start: {
      type: String,
      required: true,
      default: '09:00'
    },
    end: {
      type: String,
      required: true,
      default: '17:00'
    }
  },
  timeSlots: [timeSlotSchema],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
scheduleSchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
