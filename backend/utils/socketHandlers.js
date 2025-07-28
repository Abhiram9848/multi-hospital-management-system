const VideoCall = require('../models/VideoCall');
const jwt = require('jsonwebtoken');

// WebRTC signaling handlers
const handleVideoCallEvents = (io, socket) => {
    console.log('User connected for video call:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.hospitalId = decoded.hospitalId;
            socket.emit('authenticated', { userId: decoded.id });
        } catch (error) {
            socket.emit('authentication_error', { message: 'Invalid token' });
        }
    });

    // Join a meeting room
    socket.on('join-meeting', async (meetingId) => {
        try {
            if (!socket.userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            const videoCall = await VideoCall.findOne({ 
                meetingId,
                hospitalId: socket.hospitalId 
            }).populate('participants.userId', 'firstName lastName');

            if (!videoCall) {
                socket.emit('error', { message: 'Meeting not found' });
                return;
            }

            // Join the socket room
            socket.join(meetingId);
            socket.currentMeeting = meetingId;

            // Notify others that user joined
            socket.to(meetingId).emit('user-joined', {
                userId: socket.userId,
                socketId: socket.id
            });

            // Send current participants to the new user
            const otherParticipants = Array.from(io.sockets.adapter.rooms.get(meetingId) || [])
                .filter(id => id !== socket.id)
                .map(id => ({
                    socketId: id,
                    userId: io.sockets.sockets.get(id)?.userId
                }));

            socket.emit('existing-participants', otherParticipants);

            console.log(`User ${socket.userId} joined meeting ${meetingId}`);
        } catch (error) {
            console.error('Error joining meeting:', error);
            socket.emit('error', { message: 'Failed to join meeting' });
        }
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ targetSocketId, offer }) => {
        socket.to(targetSocketId).emit('offer', {
            fromSocketId: socket.id,
            offer
        });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ targetSocketId, answer }) => {
        socket.to(targetSocketId).emit('answer', {
            fromSocketId: socket.id,
            answer
        });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
        socket.to(targetSocketId).emit('ice-candidate', {
            fromSocketId: socket.id,
            candidate
        });
    });

    // Screen sharing
    socket.on('start-screen-share', (meetingId) => {
        socket.to(meetingId).emit('user-started-screen-share', {
            userId: socket.userId,
            socketId: socket.id
        });
    });

    socket.on('stop-screen-share', (meetingId) => {
        socket.to(meetingId).emit('user-stopped-screen-share', {
            userId: socket.userId,
            socketId: socket.id
        });
    });

    // Audio/Video controls
    socket.on('toggle-audio', ({ meetingId, isMuted }) => {
        socket.to(meetingId).emit('user-audio-toggled', {
            userId: socket.userId,
            socketId: socket.id,
            isMuted
        });
    });

    socket.on('toggle-video', ({ meetingId, isCameraOff }) => {
        socket.to(meetingId).emit('user-video-toggled', {
            userId: socket.userId,
            socketId: socket.id,
            isCameraOff
        });
    });

    // Chat messages
    socket.on('send-chat-message', async ({ meetingId, message, translations }) => {
        try {
            const videoCall = await VideoCall.findOne({ 
                meetingId,
                hospitalId: socket.hospitalId 
            });

            if (videoCall) {
                await videoCall.addChatMessage(socket.userId, message, translations);
                
                // Broadcast to all participants
                io.to(meetingId).emit('new-chat-message', {
                    senderId: socket.userId,
                    message,
                    translations,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Error sending chat message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Real-time subtitles
    socket.on('send-subtitle', async ({ meetingId, text, language, confidence, translations }) => {
        try {
            const videoCall = await VideoCall.findOne({ 
                meetingId,
                hospitalId: socket.hospitalId 
            });

            if (videoCall) {
                await videoCall.addSubtitle(socket.userId, text, language, confidence, translations);
                
                // Broadcast to all participants
                io.to(meetingId).emit('new-subtitle', {
                    speakerId: socket.userId,
                    text,
                    language,
                    confidence,
                    translations,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Error sending subtitle:', error);
            socket.emit('error', { message: 'Failed to send subtitle' });
        }
    });

    // Recording controls
    socket.on('start-recording', async (meetingId) => {
        try {
            const videoCall = await VideoCall.findOne({ 
                meetingId,
                hospitalId: socket.hospitalId 
            });

            if (videoCall && videoCall.hostId.toString() === socket.userId.toString()) {
                videoCall.recordingStatus = 'recording';
                await videoCall.save();

                io.to(meetingId).emit('recording-started', {
                    startedBy: socket.userId,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Error starting recording:', error);
            socket.emit('error', { message: 'Failed to start recording' });
        }
    });

    socket.on('stop-recording', async (meetingId) => {
        try {
            const videoCall = await VideoCall.findOne({ 
                meetingId,
                hospitalId: socket.hospitalId 
            });

            if (videoCall && videoCall.hostId.toString() === socket.userId.toString()) {
                videoCall.recordingStatus = 'stopped';
                await videoCall.save();

                io.to(meetingId).emit('recording-stopped', {
                    stoppedBy: socket.userId,
                    timestamp: new Date()
                });
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            socket.emit('error', { message: 'Failed to stop recording' });
        }
    });

    // Leave meeting
    socket.on('leave-meeting', (meetingId) => {
        if (socket.currentMeeting === meetingId) {
            socket.leave(meetingId);
            socket.to(meetingId).emit('user-left', {
                userId: socket.userId,
                socketId: socket.id
            });
            socket.currentMeeting = null;
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        if (socket.currentMeeting) {
            socket.to(socket.currentMeeting).emit('user-left', {
                userId: socket.userId,
                socketId: socket.id
            });
        }
    });

    // Participant management
    socket.on('mute-participant', ({ meetingId, targetUserId }) => {
        socket.to(meetingId).emit('participant-muted', {
            targetUserId,
            mutedBy: socket.userId
        });
    });

    socket.on('remove-participant', ({ meetingId, targetUserId }) => {
        // Find the target participant's socket
        const room = io.sockets.adapter.rooms.get(meetingId);
        if (room) {
            for (const socketId of room) {
                const targetSocket = io.sockets.sockets.get(socketId);
                if (targetSocket && targetSocket.userId === targetUserId) {
                    targetSocket.emit('removed-from-meeting', {
                        removedBy: socket.userId
                    });
                    targetSocket.leave(meetingId);
                    break;
                }
            }
        }
    });

    // Raise hand feature
    socket.on('raise-hand', (meetingId) => {
        socket.to(meetingId).emit('hand-raised', {
            userId: socket.userId,
            socketId: socket.id
        });
    });

    socket.on('lower-hand', (meetingId) => {
        socket.to(meetingId).emit('hand-lowered', {
            userId: socket.userId,
            socketId: socket.id
        });
    });

    // Virtual backgrounds and effects
    socket.on('background-changed', ({ meetingId, backgroundType, backgroundData }) => {
        socket.to(meetingId).emit('user-background-changed', {
            userId: socket.userId,
            socketId: socket.id,
            backgroundType,
            backgroundData
        });
    });

    // Breakout rooms (future feature)
    socket.on('create-breakout-room', ({ meetingId, participants }) => {
        // Implementation for breakout rooms
        console.log('Breakout room creation requested');
    });
};

module.exports = { handleVideoCallEvents };
