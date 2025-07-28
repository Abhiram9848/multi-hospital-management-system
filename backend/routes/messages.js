const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// GET /api/messages/:appointmentId - Get chat history for an appointment
router.get('/:appointmentId', protect, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({ appointmentId })
      .sort({ createdAt: 1 }) // Oldest first
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    res.json({
      messages,
      page: parseInt(page),
      limit: parseInt(limit),
      total: await Message.countDocuments({ appointmentId })
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/messages/:messageId/read - Mark message as read
router.patch('/:messageId/read', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only the receiver can mark message as read
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/unread/:userId - Get unread message count for user
router.get('/unread/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
