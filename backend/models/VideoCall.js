const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['host', 'participant'],
        default: 'participant'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: {
        type: Date
    },
    isMuted: {
        type: Boolean,
        default: false
    },
    isCameraOff: {
        type: Boolean,
        default: false
    },
    isScreenSharing: {
        type: Boolean,
        default: false
    }
});

const chatMessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isTranslated: {
        type: Boolean,
        default: false
    },
    originalLanguage: {
        type: String
    },
    translations: [{
        language: String,
        text: String
    }]
});

const subtitleSchema = new mongoose.Schema({
    speakerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    language: {
        type: String,
        default: 'en'
    },
    confidence: {
        type: Number,
        default: 0
    },
    translations: [{
        language: String,
        text: String,
        confidence: Number
    }]
});

const videoCallSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [participantSchema],
    scheduledTime: {
        type: Date
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'ended', 'cancelled'],
        default: 'scheduled'
    },
    settings: {
        allowChat: {
            type: Boolean,
            default: true
        },
        allowScreenShare: {
            type: Boolean,
            default: true
        },
        allowRecording: {
            type: Boolean,
            default: true
        },
        enableTranslation: {
            type: Boolean,
            default: true
        },
        enableSubtitles: {
            type: Boolean,
            default: true
        },
        defaultLanguage: {
            type: String,
            default: 'en'
        },
        maxParticipants: {
            type: Number,
            default: 100
        },
        waitingRoom: {
            type: Boolean,
            default: false
        },
        muteOnEntry: {
            type: Boolean,
            default: false
        },
        disableCameraOnEntry: {
            type: Boolean,
            default: false
        }
    },
    chatMessages: [chatMessageSchema],
    subtitles: [subtitleSchema],
    recordingUrl: {
        type: String
    },
    recordingStatus: {
        type: String,
        enum: ['not-started', 'recording', 'paused', 'stopped', 'processing', 'completed'],
        default: 'not-started'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique meeting ID
videoCallSchema.pre('save', function(next) {
    if (!this.meetingId) {
        this.meetingId = this.generateMeetingId();
    }
    this.updatedAt = Date.now();
    next();
});

videoCallSchema.methods.generateMeetingId = function() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let result = '';
    
    // Generate 3 groups of 4 characters each: abc-def-ghi
    for (let group = 0; group < 3; group++) {
        if (group > 0) result += '-';
        for (let i = 0; i < 3; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return result;
};

videoCallSchema.methods.addParticipant = function(userId, role = 'participant') {
    const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
    if (!existingParticipant) {
        this.participants.push({
            userId,
            role,
            joinedAt: new Date()
        });
    }
    return this.save();
};

videoCallSchema.methods.removeParticipant = function(userId) {
    const participant = this.participants.find(p => p.userId.toString() === userId.toString());
    if (participant) {
        participant.leftAt = new Date();
    }
    return this.save();
};

videoCallSchema.methods.addChatMessage = function(senderId, message, translations = []) {
    this.chatMessages.push({
        senderId,
        message,
        timestamp: new Date(),
        translations
    });
    return this.save();
};

videoCallSchema.methods.addSubtitle = function(speakerId, text, language = 'en', confidence = 0, translations = []) {
    this.subtitles.push({
        speakerId,
        text,
        timestamp: new Date(),
        language,
        confidence,
        translations
    });
    return this.save();
};

module.exports = mongoose.model('VideoCall', videoCallSchema);
