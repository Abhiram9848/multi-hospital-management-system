const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'USA'
    }
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  establishedDate: {
    type: Date,
    required: true
  },
  hospitalType: {
    type: String,
    enum: ['government', 'private', 'charitable', 'corporate'],
    required: true
  },
  specialties: [{
    type: String,
    trim: true
  }],
  capacity: {
    totalBeds: {
      type: Number,
      required: true
    },
    icuBeds: {
      type: Number,
      default: 0
    },
    emergencyBeds: {
      type: Number,
      default: 0
    }
  },
  facilities: [{
    type: String,
    trim: true
  }],
  website: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  settings: {
    appointmentSlotDuration: {
      type: Number,
      default: 30 // minutes
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      }
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }],
    allowOnlineAppointments: {
      type: Boolean,
      default: true
    },
    requireApprovalForAppointments: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Index for better performance (email, registrationNumber, licenseNumber already have unique indexes)
hospitalSchema.index({ isActive: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
