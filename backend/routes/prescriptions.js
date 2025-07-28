const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');

// @desc    Add/Update prescription for appointment
// @route   PUT /api/prescriptions/:appointmentId
// @access  Private - Doctor only
const addPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { medicines, instructions } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if the doctor owns this appointment
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.prescription = { medicines, instructions };
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email phone dateOfBirth gender bloodGroup')
      .populate('doctor', 'name specialization qualification')
      .populate('department', 'name');

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prescription history for a patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private - Doctor/Patient
const getPrescriptionHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Authorization check
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const appointments = await Appointment.find({
      patient: patientId,
      'prescription.medicines': { $exists: true, $ne: [] }
    })
      .populate('doctor', 'name specialization')
      .populate('department', 'name')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.put('/:appointmentId', protect, authorize('doctor'), addPrescription);
router.get('/patient/:patientId', protect, getPrescriptionHistory);

module.exports = router;
