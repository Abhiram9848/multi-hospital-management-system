const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');

// @desc    Create new department
// @route   POST /api/departments
// @access  Private - SuperAdmin/Admin only
const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    console.log('Getting departments for user:', req.user.name, 'Role:', req.user.role);
    
    const departments = await Department.find({ isActive: true })
      .populate('headOfDepartment', 'name email')
      .sort({ name: 1 });
    
    console.log('Found departments:', departments.length);
    console.log('Departments:', departments.map(d => ({ id: d._id, name: d.name })));
    
    res.json(departments);
  } catch (error) {
    console.error('Error in getDepartments:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headOfDepartment', 'name email phone');
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private - SuperAdmin/Admin only
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('headOfDepartment', 'name email');
    
    res.json(updatedDepartment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private - SuperAdmin only
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.post('/', protect, authorize('superadmin', 'admin'), createDepartment);
router.get('/', protect, getDepartments);
router.get('/:id', protect, getDepartmentById);
router.put('/:id', protect, authorize('superadmin', 'admin'), updateDepartment);
router.delete('/:id', protect, authorize('superadmin'), deleteDepartment);

module.exports = router;
