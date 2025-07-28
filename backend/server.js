const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketio = require('socket.io');

dotenv.config();

// Import models
const Message = require('./models/Message');

// Import video call handlers
const { handleVideoCallEvents } = require('./utils/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/videocalls', require('./routes/videocalls'));
app.use('/api/analytics', require('./routes/analytics'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error:', err);
});

// Socket.io connection handling
const activeUsers = new Map();
const activeCalls = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle video call events
  handleVideoCallEvents(io, socket);

  // User joins with their ID and role
  socket.on('join', ({ userId, userRole, userName }) => {
    console.log(`\n=== USER JOINING ===`);
    console.log(`User ID: "${userId}" (type: ${typeof userId})`);
    console.log(`Role: ${userRole}`);
    console.log(`Name: ${userName}`);
    console.log(`Socket: ${socket.id}`);
    
    // Remove any existing connection for this user to prevent duplicates
    for (const [existingUserId, userData] of activeUsers.entries()) {
      if (existingUserId === userId) {
        console.log(`Removing existing connection for user ${userId} (socket: ${userData.socketId})`);
        activeUsers.delete(existingUserId);
        break;
      }
    }

    // Add user to active users map
    activeUsers.set(userId, {
      socketId: socket.id,
      role: userRole,
      name: userName,
      status: 'online'
    });
    
    // Store user info on socket for easy reference
    socket.userId = userId;
    socket.userRole = userRole;
    socket.userName = userName;
    
    console.log(`${userName} (${userRole}) joined with ID: ${userId}, socket: ${socket.id}`);
    console.log('Active users:', Array.from(activeUsers.entries()).map(([id, data]) => `${id}(${data.name})`));
  });

  // Video call handlers for dashboard integration
  socket.on('call_user', ({ appointmentId, callerId, callerName, receiverId }) => {
    console.log(`\n=== VIDEO CALL INITIATION ===`);
    console.log(`From: ${callerName} (${callerId})`);
    console.log(`To: ${receiverId}`);
    console.log(`Appointment: ${appointmentId}`);
    console.log(`Caller socket: ${socket.id}`);
    console.log(`Active users:`, Array.from(activeUsers.entries()).map(([id, data]) => `${id}(${data.name})`));
    
    // Find the receiver's socket
    const receiverData = activeUsers.get(receiverId);
    if (receiverData) {
      console.log(`Found receiver data:`, receiverData);
      console.log(`Calling receiver at socket: ${receiverData.socketId}`);
      io.to(receiverData.socketId).emit('incoming_call', {
        appointmentId,
        callerId,
        callerName,
        receiverId
      });
      console.log(`incoming_call event sent to ${receiverData.socketId}`);
    } else {
      console.log(`Receiver ${receiverId} not found in active users`);
      console.log(`Available user IDs:`, Array.from(activeUsers.keys()));
      socket.emit('call_failed', { 
        reason: 'User not available',
        receiverId 
      });
    }
  });

  socket.on('answer_call', ({ appointmentId, callerId, signal }) => {
    console.log(`\n=== CALL ANSWERED ===`);
    console.log(`Appointment: ${appointmentId}`);
    console.log(`Caller: ${callerId}`);
    console.log(`Answerer socket: ${socket.id}`);
    console.log(`Answerer user: ${socket.userId}`);
    console.log(`Signal type:`, signal?.type);
    
    // Find the caller's socket
    const callerData = activeUsers.get(callerId);
    if (callerData) {
      console.log(`Found caller data:`, callerData);
      console.log(`Notifying caller at socket: ${callerData.socketId}`);
      
      // Send call accepted event with signal
      io.to(callerData.socketId).emit('call_accepted', {
        appointmentId,
        signal
      });
      console.log(`call_accepted event sent to ${callerData.socketId}`);
      
      // Also send the signal directly for WebRTC
      io.to(callerData.socketId).emit('signal', {
        appointmentId,
        signal,
        fromUserId: socket.userId
      });
      console.log(`signal event sent to ${callerData.socketId}`);
    } else {
      console.log(`Caller ${callerId} not found in active users`);
      console.log(`Available user IDs:`, Array.from(activeUsers.keys()));
      console.log(`Looking for caller ID: "${callerId}" (type: ${typeof callerId})`);
      
      // Try to find by socket ID as fallback
      for (const [userId, userData] of activeUsers.entries()) {
        console.log(`User: "${userId}" (type: ${typeof userId}), Socket: ${userData.socketId}`);
      }
    }
  });

  socket.on('reject_call', ({ callerId }) => {
    console.log(`\n=== CALL REJECTED ===`);
    console.log(`Caller: ${callerId}`);
    
    const callerData = activeUsers.get(callerId);
    if (callerData) {
      io.to(callerData.socketId).emit('call_rejected');
    }
  });

  socket.on('end_call', ({ appointmentId }) => {
    console.log(`\n=== CALL ENDED ===`);
    console.log(`Appointment: ${appointmentId}`);
    
    // Notify all participants
    socket.broadcast.emit('call_ended', { appointmentId });
  });

  socket.on('signal', ({ appointmentId, signal, targetUserId }) => {
    console.log(`\n=== WEBRTC SIGNAL ===`);
    console.log(`Appointment: ${appointmentId}`);
    console.log(`Target: ${targetUserId}`);
    
    const targetData = activeUsers.get(targetUserId);
    if (targetData) {
      io.to(targetData.socketId).emit('signal', {
        appointmentId,
        signal,
        fromUserId: socket.userId
      });
    }
  });

  // Chat messaging
  socket.on('send_message', async ({ appointmentId, senderId, receiverId, message, senderName }) => {
    console.log(`\n=== MESSAGE SENDING ===`);
    console.log(`From: ${senderName} (${senderId})`);
    console.log(`To: ${receiverId}`);
    console.log(`Appointment: ${appointmentId}`);
    console.log(`Message: ${message}`);
    console.log(`Socket ID: ${socket.id}`);
    
    // Verify sender is the connected user
    if (socket.userId !== senderId) {
      console.log(`WARNING: Socket user ID (${socket.userId}) doesn't match sender ID (${senderId})`);
    }
    
    try {
      const receiver = activeUsers.get(receiverId);
      const sender = activeUsers.get(senderId);
      const receiverName = receiver ? receiver.name : 'Unknown';
      
      console.log(`Sender in active users: ${sender ? `${sender.name} (${sender.socketId})` : 'NOT FOUND'}`);
      console.log(`Receiver in active users: ${receiver ? `${receiver.name} (${receiver.socketId})` : 'NOT FOUND'}`);
      
      // Save message to database
      const newMessage = new Message({
        appointmentId,
        senderId,
        receiverId,
        senderName,
        receiverName,
        message,
        isDelivered: !!receiver
      });
      
      const savedMessage = await newMessage.save();
      console.log('Message saved to database with ID:', savedMessage._id);
      
      const messageData = {
        appointmentId,
        senderId,
        receiverId,
        message,
        senderName,
        timestamp: savedMessage.createdAt,
        messageId: savedMessage._id
      };
      
      if (receiver) {
        console.log(`Sending message to ${receiver.name} at socket ${receiver.socketId}`);
        
        // Send to receiver
        io.to(receiver.socketId).emit('receive_message', messageData);
        console.log('Message sent successfully to receiver');
        
        // Update delivery status
        savedMessage.isDelivered = true;
        await savedMessage.save();
      } else {
        console.log(`ERROR: Receiver ${receiverId} not found in active users`);
        console.log('Available users:', Array.from(activeUsers.entries()).map(([id, data]) => `${id}(${data.name})`));
      }
      
      // Send confirmation back to sender
      io.to(socket.id).emit('message_sent', {
        appointmentId,
        messageId: savedMessage._id,
        timestamp: savedMessage.createdAt,
        delivered: !!receiver
      });
      
    } catch (error) {
      console.error('Error saving message:', error);
      io.to(socket.id).emit('message_error', {
        appointmentId,
        error: 'Failed to save message'
      });
    }
    console.log(`=== END MESSAGE SENDING ===\n`);
  });

  // Typing indicators
  socket.on('typing_start', ({ appointmentId, userId, userName, receiverId }) => {
    const receiver = activeUsers.get(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit('user_typing', {
        appointmentId,
        userId,
        userName,
        isTyping: true
      });
    }
  });

  socket.on('typing_stop', ({ appointmentId, userId, receiverId }) => {
    const receiver = activeUsers.get(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit('user_typing', {
        appointmentId,
        userId,
        isTyping: false
      });
    }
  });

  // Video call signaling
  socket.on('call_user', ({ appointmentId, callerId, callerName, receiverId }) => {
    console.log(`Call from ${callerName} (${callerId}) to ${receiverId}`);
    const receiver = activeUsers.get(receiverId);
    if (receiver) {
      console.log(`Sending call notification to ${receiver.name} at socket ${receiver.socketId}`);
      io.to(receiver.socketId).emit('incoming_call', {
        appointmentId,
        callerId,
        callerName,
        signal: socket.id
      });
      console.log('Call notification sent successfully');
    } else {
      console.log(`Call receiver ${receiverId} not found in active users`);
      console.log('Available users:', Array.from(activeUsers.keys()));
    }
  });

  socket.on('answer_call', ({ appointmentId, callerId, signal }) => {
    const caller = activeUsers.get(callerId);
    if (caller) {
      io.to(caller.socketId).emit('call_accepted', {
        appointmentId,
        signal
      });
      activeCalls.set(appointmentId, { caller: callerId, receiver: socket.userId });
    }
  });

  socket.on('reject_call', ({ callerId }) => {
    const caller = activeUsers.get(callerId);
    if (caller) {
      io.to(caller.socketId).emit('call_rejected');
    }
  });

  socket.on('end_call', ({ appointmentId }) => {
    const call = activeCalls.get(appointmentId);
    if (call) {
      const caller = activeUsers.get(call.caller);
      const receiver = activeUsers.get(call.receiver);
      
      if (caller) io.to(caller.socketId).emit('call_ended');
      if (receiver) io.to(receiver.socketId).emit('call_ended');
      
      activeCalls.delete(appointmentId);
    }
  });

  // WebRTC signaling
  socket.on('signal', ({ appointmentId, signal, to }) => {
    console.log(`WebRTC signal from ${socket.userId} to ${to}`);
    const receiver = activeUsers.get(to);
    if (receiver) {
      console.log(`Forwarding WebRTC signal to ${receiver.name} at socket ${receiver.socketId}`);
      io.to(receiver.socketId).emit('signal', {
        appointmentId,
        signal,
        from: socket.userId
      });
      console.log('WebRTC signal sent successfully');
    } else {
      console.log(`WebRTC signal receiver ${to} not found in active users`);
      console.log('Available users:', Array.from(activeUsers.keys()));
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      // End any active calls for this user
      for (const [appointmentId, call] of activeCalls.entries()) {
        if (call.caller === socket.userId || call.receiver === socket.userId) {
          console.log(`Ending call ${appointmentId} due to user disconnect`);
          const otherUserId = call.caller === socket.userId ? call.receiver : call.caller;
          const otherUser = activeUsers.get(otherUserId);
          if (otherUser) {
            io.to(otherUser.socketId).emit('call_ended');
          }
          activeCalls.delete(appointmentId);
        }
      }
      
      const userData = activeUsers.get(socket.userId);
      activeUsers.delete(socket.userId);
      console.log(`User ${socket.userId} (${socket.userName || 'Unknown'}) disconnected from socket ${socket.id}`);
      console.log('Remaining active users:', Array.from(activeUsers.entries()).map(([id, data]) => `${id}(${data.name})`));
    } else {
      console.log(`Unknown user disconnected from socket ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
