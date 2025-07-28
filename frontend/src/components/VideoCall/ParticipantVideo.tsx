import React, { useRef, useEffect } from 'react';

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
  name?: string;
}

interface ParticipantVideoProps {
  participant: Participant;
  isHost: boolean;
  onMuteParticipant: (userId: string) => void;
  onRemoveParticipant: (userId: string) => void;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  participant,
  isHost,
  onMuteParticipant,
  onRemoveParticipant
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const handleMuteClick = () => {
    if (isHost && participant.userId) {
      onMuteParticipant(participant.userId);
    }
  };

  const handleRemoveClick = () => {
    if (isHost && participant.userId) {
      onRemoveParticipant(participant.userId);
    }
  };

  return (
    <div className={`video-container ${participant.isCameraOff ? 'camera-off' : ''}`}>
      {participant.stream && !participant.isCameraOff && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="video-element"
        />
      )}
      
      {participant.isCameraOff && (
        <div className="camera-off-placeholder">
          <div className="avatar-placeholder">
            {participant.name ? participant.name.charAt(0).toUpperCase() : '?'}
          </div>
        </div>
      )}

      {participant.handRaised && (
        <div className="hand-raised-indicator">
          ✋ Hand raised
        </div>
      )}

      <div className="video-overlay">
        <span className="participant-name">
          {participant.name || `Participant ${participant.userId}`}
          {participant.isHost && ' (Host)'}
        </span>
        <div className="participant-status">
          {participant.isMuted && <span className="muted-indicator">🔇</span>}
          {participant.isScreenSharing && <span className="screen-share-indicator">📺</span>}
        </div>
      </div>

      {isHost && (
        <div className="participant-controls">
          <button
            className="participant-control-btn"
            onClick={handleMuteClick}
            title="Mute participant"
          >
            🔇
          </button>
          <button
            className="participant-control-btn danger"
            onClick={handleRemoveClick}
            title="Remove participant"
          >
            ❌
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantVideo;
