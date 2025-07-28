const express = require('express');
const router = express.Router();
const VideoCall = require('../models/VideoCall');
const User = require('../models/User');
const { protect: auth } = require('../middleware/auth');
// const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Translate (you'll need to set up credentials)
// const translate = new Translate({
//     projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
//     keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE
// });

// Create a new video call/meeting
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, scheduledTime, settings } = req.body;
        
        const videoCall = new VideoCall({
            title,
            description,
            hospitalId: req.user.hospitalId,
            hostId: req.user.id,
            scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
            settings: {
                ...settings,
                defaultLanguage: settings?.defaultLanguage || 'en'
            }
        });

        // Add host as first participant
        await videoCall.addParticipant(req.user.id, 'host');
        
        await videoCall.save();
        
        res.status(201).json({
            success: true,
            data: videoCall,
            meetingUrl: `${process.env.FRONTEND_URL}/video-call/${videoCall.meetingId}`
        });
    } catch (error) {
        console.error('Error creating video call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create video call',
            error: error.message
        });
    }
});

// Get video call by meeting ID
router.get('/:meetingId', auth, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOne({ 
            meetingId: req.params.meetingId,
            hospitalId: req.user.hospitalId 
        }).populate('hostId', 'firstName lastName email role')
          .populate('participants.userId', 'firstName lastName email role')
          .populate('chatMessages.senderId', 'firstName lastName')
          .populate('subtitles.speakerId', 'firstName lastName');

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Video call not found'
            });
        }

        res.json({
            success: true,
            data: videoCall
        });
    } catch (error) {
        console.error('Error fetching video call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video call',
            error: error.message
        });
    }
});

// Join a video call
router.post('/:meetingId/join', auth, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOne({ 
            meetingId: req.params.meetingId,
            hospitalId: req.user.hospitalId 
        });

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Video call not found'
            });
        }

        // Check if user is already a participant
        const existingParticipant = videoCall.participants.find(
            p => p.userId.toString() === req.user.id.toString()
        );

        if (!existingParticipant) {
            await videoCall.addParticipant(req.user.id);
        }

        // Update call status to active if it's the first join
        if (videoCall.status === 'scheduled') {
            videoCall.status = 'active';
            videoCall.startTime = new Date();
            await videoCall.save();
        }

        res.json({
            success: true,
            data: videoCall,
            message: 'Successfully joined the video call'
        });
    } catch (error) {
        console.error('Error joining video call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join video call',
            error: error.message
        });
    }
});

// Leave a video call
router.post('/:meetingId/leave', auth, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOne({ 
            meetingId: req.params.meetingId,
            hospitalId: req.user.hospitalId 
        });

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Video call not found'
            });
        }

        await videoCall.removeParticipant(req.user.id);

        res.json({
            success: true,
            message: 'Successfully left the video call'
        });
    } catch (error) {
        console.error('Error leaving video call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave video call',
            error: error.message
        });
    }
});

// Send chat message
router.post('/:meetingId/chat', auth, async (req, res) => {
    try {
        const { message, targetLanguages = [] } = req.body;
        
        const videoCall = await VideoCall.findOne({ 
            meetingId: req.params.meetingId,
            hospitalId: req.user.hospitalId 
        });

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Video call not found'
            });
        }

        let translations = [];
        
        // Translate message if target languages are specified
        if (targetLanguages.length > 0) {
            try {
                for (const targetLang of targetLanguages) {
                    // const [translation] = await translate.translate(message, targetLang);
                    translations.push({
                        language: targetLang,
                        text: `[${targetLang.toUpperCase()}] ${message}` // Fallback format
                    });
                }
            } catch (translateError) {
                console.error('Translation error:', translateError);
                // Continue without translations if translation fails
            }
        }

        await videoCall.addChatMessage(req.user.id, message, translations);

        res.json({
            success: true,
            message: 'Chat message sent successfully',
            translations
        });
    } catch (error) {
        console.error('Error sending chat message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send chat message',
            error: error.message
        });
    }
});

// Add subtitle/transcription
router.post('/:meetingId/subtitles', auth, async (req, res) => {
    try {
        const { text, language = 'en', confidence = 0, targetLanguages = [] } = req.body;
        
        const videoCall = await VideoCall.findOne({ 
            meetingId: req.params.meetingId,
            hospitalId: req.user.hospitalId 
        });

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Video call not found'
            });
        }

        let translations = [];
        
        // Translate subtitle if target languages are specified
        if (targetLanguages.length > 0) {
            try {
                for (const targetLang of targetLanguages) {
                    // const [translation] = await translate.translate(text, targetLang);
                    translations.push({
                        language: targetLang,
                        text: `[${targetLang.toUpperCase()}] ${text}`, // Fallback format
                        confidence: confidence * 0.9 // Slightly lower confidence for translations
                    });
                }
            } catch (translateError) {
                console.error('Translation error:', translateError);
            }
        }

        await videoCall.addSubtitle(req.user.id, text, language, confidence, translations);

        res.json({
            success: true,
            message: 'Subtitle added successfully',
            translations
        });
    } catch (error) {
        console.error('Error adding subtitle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add subtitle',
            error: error.message
        });
    }
});

// Update call settings
router.patch('/:meetingId/settings', auth, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOne({ 
            meetingId: req.params.meetingId,
            hospitalId: req.user.hospitalId 
        });

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Video call not found'
            });
        }

        // Check if user is host
        if (videoCall.hostId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only host can update call settings'
            });
        }

        videoCall.settings = { ...videoCall.settings, ...req.body };
        await videoCall.save();

        res.json({
            success: true,
            data: videoCall.settings,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});

// End video call
router.post('/:meetingId/end', auth, async (req, res) => {
    try {
        const videoCall = await VideoCall.findOne({ 
            meetingId: req.params.meetingId,
            hospitalId: req.user.hospitalId 
        });

        if (!videoCall) {
            return res.status(404).json({
                success: false,
                message: 'Video call not found'
            });
        }

        // Check if user is host
        if (videoCall.hostId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only host can end the call'
            });
        }

        videoCall.status = 'ended';
        videoCall.endTime = new Date();
        await videoCall.save();

        res.json({
            success: true,
            message: 'Video call ended successfully'
        });
    } catch (error) {
        console.error('Error ending video call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end video call',
            error: error.message
        });
    }
});

// Translation endpoint
router.post('/translate', auth, async (req, res) => {
    try {
        const { text, from, to } = req.body;
        
        if (!text || !to) {
            return res.status(400).json({
                success: false,
                message: 'Text and target language are required'
            });
        }

        // Use Google Translate API if configured
        // if (process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_KEY_FILE) {
        //     try {
        //         const [translation] = await translate.translate(text, to);
        //         return res.json({
        //             success: true,
        //             translation
        //         });
        //     } catch (translateError) {
        //         console.error('Google Translate error:', translateError);
        //     }
        // }

        // Fallback to a simple translation service or return original text
        // For demo purposes, return original text with language indicator
        res.json({
            success: true,
            translation: `[${to.toUpperCase()}] ${text}`,
            note: 'Translation service not configured. Showing original text with language indicator.'
        });
        
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({
            success: false,
            message: 'Translation failed',
            error: error.message
        });
    }
});

// Get user's video calls
router.get('/', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = {
            hospitalId: req.user.hospitalId,
            $or: [
                { hostId: req.user.id },
                { 'participants.userId': req.user.id }
            ]
        };

        if (status) {
            query.status = status;
        }

        const videoCalls = await VideoCall.find(query)
            .populate('hostId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await VideoCall.countDocuments(query);

        res.json({
            success: true,
            data: videoCalls,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching video calls:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch video calls',
            error: error.message
        });
    }
});

// Upload recording endpoint
router.post('/upload-recording', auth, async (req, res) => {
    try {
        // This is a placeholder for file upload functionality
        // In a production environment, you would:
        // 1. Use multer or similar middleware for file uploads
        // 2. Store files in cloud storage (AWS S3, Google Cloud Storage, etc.)
        // 3. Update the VideoCall record with the recording URL
        
        const { meetingId } = req.body;
        
        if (!meetingId) {
            return res.status(400).json({
                success: false,
                message: 'Meeting ID is required'
            });
        }

        // For now, just return success
        res.json({
            success: true,
            message: 'Recording upload endpoint ready (not implemented)',
            recordingUrl: `https://recordings.example.com/${meetingId}-${Date.now()}.webm`
        });
        
    } catch (error) {
        console.error('Recording upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Recording upload failed',
            error: error.message
        });
    }
});

module.exports = router;
