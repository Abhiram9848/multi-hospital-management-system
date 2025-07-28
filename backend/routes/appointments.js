const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private - Patient/Admin/SuperAdmin
const createAppointment = async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      patient: req.user.role === 'patient' ? req.user._id : req.body.patient
    };

    const appointment = await Appointment.create(appointmentData);
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', '_id name email phone')
      .populate('doctor', '_id name specialization')
      .populate('department', '_id name');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let filter = {};

    // Filter based on user role
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', '_id name email phone')
      .populate('doctor', '_id name specialization')
      .populate('department', '_id name')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', '_id name email phone dateOfBirth gender bloodGroup')
      .populate('doctor', '_id name specialization qualification')
      .populate('department', '_id name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user can access this appointment
    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient', '_id name email phone')
     .populate('doctor', '_id name specialization')
     .populate('department', '_id name');

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only admin, superadmin, or the patient can delete
    if (!['admin', 'superadmin'].includes(req.user.role) && 
        appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medical records (completed appointments with prescriptions)
// @route   GET /api/appointments/medical-records
// @access  Private
const getMedicalRecords = async (req, res) => {
  try {
    let filter = { status: 'completed' };

    // Filter based on user role
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    const medicalRecords = await Appointment.find(filter)
      .populate('patient', '_id name email phone dateOfBirth gender bloodGroup')
      .populate('doctor', '_id name specialization qualification')
      .populate('department', '_id name description')
      .sort({ appointmentDate: -1 });

    res.json(medicalRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.post('/', protect, authorize('patient', 'admin', 'superadmin'), createAppointment);
router.get('/', protect, getAppointments);
router.get('/medical-records', protect, getMedicalRecords);
router.get('/:id', protect, getAppointmentById);
router.put('/:id', protect, updateAppointment);
router.delete('/:id', protect, deleteAppointment);

module.exports = router;
