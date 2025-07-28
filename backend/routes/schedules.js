const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { protect, authorize } = require('../middleware/auth');

// Helper function to generate time slots
const generateTimeSlots = (startTime, endTime) => {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  let current = start;
  let slotId = 1;

  while (current < end) {
    const next = new Date(current);
    next.setMinutes(current.getMinutes() + 30); // 30-minute slots

    if (next <= end) {
      slots.push({
        startTime: current.toTimeString().slice(0, 5),
        endTime: next.toTimeString().slice(0, 5),
        isBlocked: false
      });
    }
    current = next;
  }

  return slots;
};

// @desc    Get doctor's schedule
// @route   GET /api/schedules
// @access  Private - Doctor only
const getDoctorSchedule = async (req, res) => {
  try {
    let schedules = await Schedule.find({ doctor: req.user._id }).sort({ dayOfWeek: 1 });

    // If no schedules exist, create default schedule for all days
    if (schedules.length === 0) {
      const defaultSchedules = [];
      
      for (let day = 0; day < 7; day++) {
        const isWeekend = day === 0 || day === 6; // Sunday or Saturday
        const schedule = new Schedule({
          doctor: req.user._id,
          dayOfWeek: day,
          isAvailable: !isWeekend, // Available on weekdays by default
          availableHours: {
            start: '09:00',
            end: '17:00'
          },
          timeSlots: generateTimeSlots('09:00', '17:00')
        });
        
        defaultSchedules.push(schedule);
      }

      await Schedule.insertMany(defaultSchedules);
      schedules = defaultSchedules;
    }

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor's schedule for a specific day
// @route   PUT /api/schedules/:dayOfWeek
// @access  Private - Doctor only
const updateDaySchedule = async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const { isAvailable, availableHours, timeSlots, notes } = req.body;

    let schedule = await Schedule.findOne({
      doctor: req.user._id,
      dayOfWeek: parseInt(dayOfWeek)
    });

    if (!schedule) {
      // Create new schedule if it doesn't exist
      schedule = new Schedule({
        doctor: req.user._id,
        dayOfWeek: parseInt(dayOfWeek),
        isAvailable,
        availableHours,
        timeSlots: timeSlots || generateTimeSlots(availableHours.start, availableHours.end),
        notes
      });
    } else {
      // Update existing schedule
      schedule.isAvailable = isAvailable;
      schedule.availableHours = availableHours;
      schedule.notes = notes;
      
      // If working hours changed, regenerate time slots but preserve blocked ones
      if (timeSlots) {
        schedule.timeSlots = timeSlots;
      } else {
        const newSlots = generateTimeSlots(availableHours.start, availableHours.end);
        const existingBlockedSlots = schedule.timeSlots.filter(slot => slot.isBlocked);
        
        // Merge new slots with existing blocked slots
        schedule.timeSlots = newSlots.map(newSlot => {
          const blockedSlot = existingBlockedSlots.find(
            blocked => blocked.startTime === newSlot.startTime && blocked.endTime === newSlot.endTime
          );
          return blockedSlot || newSlot;
        });
      }
    }

    await schedule.save();
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block/Unblock a specific time slot
// @route   PUT /api/schedules/:dayOfWeek/slot/:slotIndex
// @access  Private - Doctor only
const toggleTimeSlot = async (req, res) => {
  try {
    const { dayOfWeek, slotIndex } = req.params;
    const { isBlocked, reason } = req.body;

    const schedule = await Schedule.findOne({
      doctor: req.user._id,
      dayOfWeek: parseInt(dayOfWeek)
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    if (slotIndex >= schedule.timeSlots.length) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    schedule.timeSlots[slotIndex].isBlocked = isBlocked;
    schedule.timeSlots[slotIndex].reason = isBlocked ? reason : undefined;

    await schedule.save();
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available time slots for a specific doctor and date (for appointment booking)
// @route   GET /api/schedules/available/:doctorId/:date
// @access  Private
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    const schedule = await Schedule.findOne({
      doctor: doctorId,
      dayOfWeek: dayOfWeek
    });

    if (!schedule || !schedule.isAvailable) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for this date
    const Appointment = require('../models/Appointment');
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: new Date(appointmentDate.toDateString()),
        $lt: new Date(appointmentDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    const bookedTimes = existingAppointments.map(apt => apt.appointmentTime);

    // Filter out blocked and booked slots
    const availableSlots = schedule.timeSlots.filter(slot => 
      !slot.isBlocked && !bookedTimes.includes(slot.startTime)
    );

    res.json({ 
      availableSlots,
      workingHours: schedule.availableHours 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get schedule for a specific doctor (for admin/patient view)
// @route   GET /api/schedules/doctor/:doctorId
// @access  Private
const getDoctorScheduleById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const schedules = await Schedule.find({ doctor: doctorId })
      .populate('doctor', 'name specialization')
      .sort({ dayOfWeek: 1 });

    if (schedules.length === 0) {
      return res.json({ message: 'No schedule found for this doctor' });
    }

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Routes
router.get('/', protect, authorize('doctor'), getDoctorSchedule);
router.put('/:dayOfWeek', protect, authorize('doctor'), updateDaySchedule);
router.put('/:dayOfWeek/slot/:slotIndex', protect, authorize('doctor'), toggleTimeSlot);
router.get('/available/:doctorId/:date', protect, getAvailableSlots);
router.get('/doctor/:doctorId', protect, getDoctorScheduleById);

module.exports = router;
