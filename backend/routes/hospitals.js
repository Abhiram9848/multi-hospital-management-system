const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const { protect, superAdminOnly } = require('../middleware/auth');

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Private (Super Admin only)
const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find()
      .populate('adminId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hospital
// @route   GET /api/hospitals/:id
// @access  Private
const getHospital = async (req, res) => {
  try {
    // Check if the provided ID is a valid ObjectId
    if (!req.params.id || req.params.id === 'undefined' || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid hospital ID provided' });
    }

    const hospital = await Hospital.findById(req.params.id)
      .populate('adminId', 'name email phone');
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }
    
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private (Super Admin only)
const createHospital = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      registrationNumber,
      licenseNumber,
      establishedDate,
      hospitalType,
      specialties,
      capacity,
      facilities,
      website,
      emergencyContact,
      subscription,
      settings
    } = req.body;

    // Check if hospital with email or registration number already exists
    const hospitalExists = await Hospital.findOne({
      $or: [
        { email },
        { registrationNumber },
        { licenseNumber }
      ]
    });

    if (hospitalExists) {
      return res.status(400).json({ 
        message: 'Hospital with this email, registration number, or license number already exists' 
      });
    }

    const hospital = await Hospital.create({
      name,
      email,
      phone,
      address,
      registrationNumber,
      licenseNumber,
      establishedDate,
      hospitalType,
      specialties,
      capacity,
      facilities,
      website,
      emergencyContact,
      subscription,
      settings
    });

    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private (Super Admin or Hospital Admin)
const updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check if user has permission to update this hospital
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.hospitalId.toString() !== hospital._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this hospital' });
    }

    const updatedHospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('adminId', 'name email phone');

    res.json(updatedHospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private (Super Admin only)
const deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check if there are users associated with this hospital
    const associatedUsers = await User.find({ hospitalId: req.params.id });
    if (associatedUsers.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete hospital with associated users. Please reassign or delete users first.' 
      });
    }

    await Hospital.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign admin to hospital
// @route   PUT /api/hospitals/:id/assign-admin
// @access  Private (Super Admin only)
const assignAdmin = async (req, res) => {
  try {
    const { adminId } = req.body;
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check if admin user exists and is an admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid admin user' });
    }

    // Check if admin is already assigned to another hospital
    if (admin.hospitalId && admin.hospitalId.toString() !== hospital._id.toString()) {
      return res.status(400).json({ message: 'Admin is already assigned to another hospital' });
    }

    // Check if hospital already has an admin
    if (hospital.adminId && hospital.adminId.toString() !== adminId) {
      return res.status(400).json({ message: 'Hospital already has an admin assigned' });
    }

    // Update hospital with admin
    hospital.adminId = adminId;
    await hospital.save();

    // Update admin with hospital
    admin.hospitalId = hospital._id;
    await admin.save();

    const updatedHospital = await Hospital.findById(req.params.id)
      .populate('adminId', 'name email phone');

    res.json(updatedHospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove admin from hospital
// @route   PUT /api/hospitals/:id/remove-admin
// @access  Private (Super Admin only)
const removeAdmin = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    if (hospital.adminId) {
      // Remove hospital reference from admin user
      await User.findByIdAndUpdate(hospital.adminId, { $unset: { hospitalId: 1 } });
      
      // Remove admin from hospital
      hospital.adminId = null;
      await hospital.save();
    }

    const updatedHospital = await Hospital.findById(req.params.id)
      .populate('adminId', 'name email phone');

    res.json(updatedHospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hospital statistics
// @route   GET /api/hospitals/:id/stats
// @access  Private (Hospital Admin or Super Admin)
const getHospitalStats = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check permissions
    if (req.user.role !== 'superadmin' && 
        (req.user.role !== 'admin' || req.user.hospitalId.toString() !== hospital._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this hospital stats' });
    }

    // Get user counts by role
    const userStats = await User.aggregate([
      { $match: { hospitalId: hospital._id } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const stats = {
      hospital: hospital.name,
      users: {
        total: await User.countDocuments({ hospitalId: hospital._id }),
        admins: userStats.find(stat => stat._id === 'admin')?.count || 0,
        doctors: userStats.find(stat => stat._id === 'doctor')?.count || 0,
        patients: userStats.find(stat => stat._id === 'patient')?.count || 0
      },
      capacity: hospital.capacity,
      isActive: hospital.isActive,
      subscription: hospital.subscription
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.get('/', protect, superAdminOnly, getHospitals);
router.get('/:id', protect, getHospital);
router.post('/', protect, superAdminOnly, createHospital);
router.put('/:id', protect, updateHospital);
router.delete('/:id', protect, superAdminOnly, deleteHospital);
router.put('/:id/assign-admin', protect, superAdminOnly, assignAdmin);
router.put('/:id/remove-admin', protect, superAdminOnly, removeAdmin);
router.get('/:id/stats', protect, getHospitalStats);

module.exports = router;
