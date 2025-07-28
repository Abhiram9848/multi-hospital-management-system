import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import './VideoCallRoom.css';
import ParticipantVideo from './ParticipantVideo';
import ChatPanel from './ChatPanel';
import ControlPanel from './ControlPanel';
import TranslationService from './TranslationService';
import SubtitleManager from './SubtitleManager';
import NativeRecordingManager from './NativeRecordingManager';

interface Participant {
  socketId: string;
  userId: string;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  isHost?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
  handRaised?: boolean;
}

interface VideoCallSettings {
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  enableTranslation: boolean;
  enableSubtitles: boolean;
  defaultLanguage: string;
  maxParticipants: number;
  waitingRoom: boolean;
  muteOnEntry: boolean;
  disableCameraOnEntry: boolean;
}

interface ChatMessage {
  senderId: string;
  message: string;
  timestamp: Date;
  translations?: Array<{ language: string; text: string }>;
  senderName?: string;
}

interface Subtitle {
  speakerId: string;
  text: string;
  timestamp: Date;
  language: string;
  confidence: number;
  translations?: Array<{ language: string; text: string; confidence: number }>;
}

const VideoCallRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  
  // Socket and connections
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // State
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [meetingData, setMeetingData] = useState<any>(null);
  const [settings, setSettings] = useState<VideoCallSettings>({
    allowChat: true,
    allowScreenShare: true,
    allowRecording: true,
    enableTranslation: true,
    enableSubtitles: true,
    defaultLanguage: 'en',
    maxParticipants: 100,
    waitingRoom: false,
    muteOnEntry: false,
    disableCameraOnEntry: false
  });
  
  // Chat and subtitles
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<string>('not-started');
  
  // Translation
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [availableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ]);

  // WebRTC configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('authenticate', token);
    });

    socket.on('authenticated', () => {
      setIsConnected(true);
      joinMeeting();
    });

    socket.on('authentication_error', () => {
      navigate('/login');
    });

    // WebRTC signaling events
    socket.on('existing-participants', handleExistingParticipants);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    
    // Video call events
    socket.on('user-audio-toggled', handleUserAudioToggled);
    socket.on('user-video-toggled', handleUserVideoToggled);
    socket.on('user-started-screen-share', handleUserStartedScreenShare);
    socket.on('user-stopped-screen-share', handleUserStoppedScreenShare);
    
    // Chat events
    socket.on('new-chat-message', handleNewChatMessage);
    
    // Subtitle events
    socket.on('new-subtitle', handleNewSubtitle);
    
    // Recording events
    socket.on('recording-started', handleRecordingStarted);
    socket.on('recording-stopped', handleRecordingStopped);
    
    // Participant management
    socket.on('participant-muted', handleParticipantMuted);
    socket.on('removed-from-meeting', handleRemovedFromMeeting);
    socket.on('hand-raised', handleHandRaised);
    socket.on('hand-lowered', handleHandLowered);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, navigate]);

  // Load meeting data
  const loadMeetingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/videocalls/${meetingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMeetingData(response.data.data);
      setSettings(response.data.data.settings);
      
      // Check if current user is host
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setIsHost(response.data.data.hostId._id === currentUser.id);
      
    } catch (error) {
      console.error('Error loading meeting data:', error);
      navigate('/dashboard');
    }
  };

  // Initialize media
  const initializeMedia = async () => {
    try {
      const constraints = {
        video: !settings.disableCameraOnEntry,
        audio: !settings.muteOnEntry
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsMuted(settings.muteOnEntry);
      setIsCameraOff(settings.disableCameraOnEntry);
      
    } catch (error) {
      console.error('Error accessing media:', error);
    }
  };

  // Join meeting
  const joinMeeting = async () => {
    if (!socketRef.current || !meetingId) return;
    
    try {
      await loadMeetingData();
      await initializeMedia();
      socketRef.current.emit('join-meeting', meetingId);
    } catch (error) {
      console.error('Error joining meeting:', error);
    }
  };

  // WebRTC signaling handlers
  const handleExistingParticipants = useCallback((participantList: Array<{ socketId: string; userId: string }>) => {
    participantList.forEach(participant => {
      createPeerConnection(participant.socketId, true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserJoined = useCallback(({ userId, socketId }: { userId: string; socketId: string }) => {
    createPeerConnection(socketId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserLeft = useCallback(({ socketId }: { socketId: string }) => {
    const peerConnection = peerConnectionsRef.current.get(socketId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(socketId);
    }
    
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      newParticipants.delete(socketId);
      return newParticipants;
    });
  }, []);

  const createPeerConnection = useCallback(async (socketId: string, isInitiator: boolean) => {
    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionsRef.current.set(socketId, peerConnection);

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setParticipants(prev => {
        const newParticipants = new Map(prev);
        const participant = newParticipants.get(socketId) || { socketId, userId: '', stream: undefined };
        participant.stream = remoteStream;
        newParticipants.set(socketId, participant);
        return newParticipants;
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetSocketId: socketId,
          candidate: event.candidate
        });
      }
    };

    if (isInitiator) {
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('offer', {
          targetSocketId: socketId,
          offer
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOffer = useCallback(async ({ fromSocketId, offer }: { fromSocketId: string; offer: RTCSessionDescriptionInit }) => {
    const peerConnection = peerConnectionsRef.current.get(fromSocketId);
    if (!peerConnection) return;

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (socketRef.current) {
      socketRef.current.emit('answer', {
        targetSocketId: fromSocketId,
        answer
      });
    }
  }, []);

  const handleAnswer = useCallback(async ({ fromSocketId, answer }: { fromSocketId: string; answer: RTCSessionDescriptionInit }) => {
    const peerConnection = peerConnectionsRef.current.get(fromSocketId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
    }
  }, []);

  const handleIceCandidate = useCallback(async ({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidate }) => {
    const peerConnection = peerConnectionsRef.current.get(fromSocketId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
    }
  }, []);

  // Media control handlers
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        if (socketRef.current) {
          socketRef.current.emit('toggle-audio', {
            meetingId,
            isMuted: !audioTrack.enabled
          });
        }
      }
    }
  }, [meetingId]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        
        if (socketRef.current) {
          socketRef.current.emit('toggle-video', {
            meetingId,
            isCameraOff: !videoTrack.enabled
          });
        }
      }
    }
  }, [meetingId]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Switch back to camera
      await initializeMedia();
      setIsScreenSharing(false);
      
      if (socketRef.current) {
        socketRef.current.emit('stop-screen-share', meetingId);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        screenStreamRef.current = screenStream;
        
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(peerConnection => {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        if (socketRef.current) {
          socketRef.current.emit('start-screen-share', meetingId);
        }
        
        // Handle screen share end
        videoTrack.onended = () => {
          toggleScreenShare();
        };
        
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScreenSharing, meetingId]);

  // Event handlers
  const handleUserAudioToggled = useCallback(({ socketId, isMuted }: { socketId: string; isMuted: boolean }) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participant = newParticipants.get(socketId);
      if (participant) {
        participant.isMuted = isMuted;
        newParticipants.set(socketId, participant);
      }
      return newParticipants;
    });
  }, []);

  const handleUserVideoToggled = useCallback(({ socketId, isCameraOff }: { socketId: string; isCameraOff: boolean }) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participant = newParticipants.get(socketId);
      if (participant) {
        participant.isCameraOff = isCameraOff;
        newParticipants.set(socketId, participant);
      }
      return newParticipants;
    });
  }, []);

  const handleUserStartedScreenShare = useCallback(({ socketId }: { socketId: string }) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participant = newParticipants.get(socketId);
      if (participant) {
        participant.isScreenSharing = true;
        newParticipants.set(socketId, participant);
      }
      return newParticipants;
    });
  }, []);

  const handleUserStoppedScreenShare = useCallback(({ socketId }: { socketId: string }) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participant = newParticipants.get(socketId);
      if (participant) {
        participant.isScreenSharing = false;
        newParticipants.set(socketId, participant);
      }
      return newParticipants;
    });
  }, []);

  const handleNewChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const handleNewSubtitle = useCallback((subtitle: Subtitle) => {
    setCurrentSubtitle(subtitle.text);
    
    // Clear subtitle after 3 seconds
    setTimeout(() => {
      setCurrentSubtitle('');
    }, 3000);
  }, []);

  const handleRecordingStarted = useCallback(() => {
    setIsRecording(true);
    setRecordingStatus('recording');
  }, []);

  const handleRecordingStopped = useCallback(() => {
    setIsRecording(false);
    setRecordingStatus('stopped');
  }, []);

  const handleParticipantMuted = useCallback(({ targetUserId }: { targetUserId: string }) => {
    // Handle participant muted by host
    console.log(`Participant ${targetUserId} was muted by host`);
  }, []);

  const handleRemovedFromMeeting = useCallback(() => {
    alert('You have been removed from the meeting by the host.');
    navigate('/dashboard');
  }, [navigate]);

  const handleHandRaised = useCallback(({ socketId }: { socketId: string }) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participant = newParticipants.get(socketId);
      if (participant) {
        participant.handRaised = true;
        newParticipants.set(socketId, participant);
      }
      return newParticipants;
    });
  }, []);

  const handleHandLowered = useCallback(({ socketId }: { socketId: string }) => {
    setParticipants(prev => {
      const newParticipants = new Map(prev);
      const participant = newParticipants.get(socketId);
      if (participant) {
        participant.handRaised = false;
        newParticipants.set(socketId, participant);
      }
      return newParticipants;
    });
  }, []);

  // Leave meeting
  const leaveMeeting = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-meeting', meetingId);
    }
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    navigate('/dashboard');
  }, [meetingId, navigate]);

  if (!isConnected) {
    return (
      <div className="video-call-loading">
        <div className="loading-spinner"></div>
        <p>Connecting to meeting...</p>
      </div>
    );
  }

  return (
    <div className="video-call-room">
      <div className="video-call-header">
        <div className="meeting-info">
          <h2>{meetingData?.title || 'Video Meeting'}</h2>
          <span className="meeting-id">Meeting ID: {meetingId}</span>
          {isRecording && <span className="recording-indicator">● REC</span>}
        </div>
        
        <div className="header-controls">
          <button 
            className="language-selector"
            onClick={() => setShowSettings(!showSettings)}
          >
            {availableLanguages.find(lang => lang.code === selectedLanguage)?.name}
          </button>
          
          <button 
            className="chat-toggle"
            onClick={() => setShowChat(!showChat)}
          >
            Chat {chatMessages.length > 0 && `(${chatMessages.length})`}
          </button>
        </div>
      </div>

      <div className="video-call-content">
        <div className="video-grid">
          {/* Local video */}
          <div className="video-container local-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`video-element ${isCameraOff ? 'camera-off' : ''}`}
            />
            <div className="video-overlay">
              <span className="participant-name">You {isHost && '(Host)'}</span>
              {isMuted && <span className="muted-indicator">🔇</span>}
              {isScreenSharing && <span className="screen-share-indicator">📺</span>}
            </div>
          </div>

          {/* Remote participants */}
          {Array.from(participants.values()).map(participant => (
            <ParticipantVideo
              key={participant.socketId}
              participant={participant}
              isHost={isHost}
              onMuteParticipant={(userId) => {
                if (socketRef.current) {
                  socketRef.current.emit('mute-participant', {
                    meetingId,
                    targetUserId: userId
                  });
                }
              }}
              onRemoveParticipant={(userId) => {
                if (socketRef.current) {
                  socketRef.current.emit('remove-participant', {
                    meetingId,
                    targetUserId: userId
                  });
                }
              }}
            />
          ))}
        </div>

        {/* Subtitles */}
        {settings.enableSubtitles && currentSubtitle && (
          <SubtitleManager
            subtitle={currentSubtitle}
            language={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            availableLanguages={availableLanguages}
          />
        )}
      </div>

      {/* Chat Panel */}
      {showChat && (
        <ChatPanel
          messages={chatMessages}
          onSendMessage={(message) => {
            if (socketRef.current) {
              socketRef.current.emit('send-chat-message', {
                meetingId,
                message,
                translations: settings.enableTranslation ? [selectedLanguage] : []
              });
            }
          }}
          selectedLanguage={selectedLanguage}
          enableTranslation={settings.enableTranslation}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Control Panel */}
      <ControlPanel
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        isHost={isHost}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onStartRecording={() => {
          if (socketRef.current) {
            socketRef.current.emit('start-recording', meetingId);
          }
        }}
        onStopRecording={() => {
          if (socketRef.current) {
            socketRef.current.emit('stop-recording', meetingId);
          }
        }}
        onRaiseHand={() => {
          if (socketRef.current) {
            socketRef.current.emit('raise-hand', meetingId);
          }
        }}
        onLeaveMeeting={leaveMeeting}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          // Update server settings if host
          if (isHost) {
            axios.patch(`/api/videocalls/${meetingId}/settings`, newSettings, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
          }
        }}
      />

      {/* Translation Service */}
      {settings.enableTranslation && (
        <TranslationService
          socket={socketRef.current}
          meetingId={meetingId}
          selectedLanguage={selectedLanguage}
          onSubtitleGenerated={(text, language, confidence) => {
            if (socketRef.current) {
              socketRef.current.emit('send-subtitle', {
                meetingId,
                text,
                language,
                confidence,
                translations: [selectedLanguage]
              });
            }
          }}
        />
      )}

      {/* Recording Manager - Using Native MediaRecorder as fallback */}
      <NativeRecordingManager
        isRecording={isRecording}
        recordingStatus={recordingStatus}
        meetingId={meetingId}
        localStream={localStreamRef.current}
        participants={participants}
      />
    </div>
  );
};

export default VideoCallRoom;
