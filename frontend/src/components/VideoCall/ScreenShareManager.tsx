import React, { useRef, useEffect, useState } from 'react';
import './ScreenShareManager.css';

interface ScreenShareManagerProps {
  isScreenSharing: boolean;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  onStreamUpdate: (stream: MediaStream | null) => void;
}

const ScreenShareManager: React.FC<ScreenShareManagerProps> = ({
  isScreenSharing,
  onStartScreenShare,
  onStopScreenShare,
  onStreamUpdate
}) => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [shareType, setShareType] = useState<'screen' | 'window' | 'tab'>('screen');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if screen sharing is supported
    const isScreenShareSupported = navigator.mediaDevices && 
      typeof navigator.mediaDevices.getDisplayMedia === 'function';
    
    setIsSupported(isScreenShareSupported);
  }, []);

  const startScreenShare = async () => {
    if (!isSupported) {
      console.error('Screen sharing not supported');
      return;
    }

    try {
      const constraints: any = {
        video: {
          cursor: 'always',
          displaySurface: shareType
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      setScreenStream(stream);
      onStreamUpdate(stream);
      onStartScreenShare();

      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

    } catch (error) {
      console.error('Error starting screen share:', error);
      
      // Handle specific errors
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            alert('Screen sharing permission denied. Please allow screen sharing and try again.');
            break;
          case 'NotFoundError':
            alert('No screen sharing source found.');
            break;
          case 'NotSupportedError':
            alert('Screen sharing is not supported in this browser.');
            break;
          default:
            alert('Failed to start screen sharing. Please try again.');
        }
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    
    onStreamUpdate(null);
    onStopScreenShare();
  };

  const handleShareTypeChange = (type: 'screen' | 'window' | 'tab') => {
    setShareType(type);
    
    // If currently sharing, restart with new type
    if (isScreenSharing) {
      stopScreenShare();
      setTimeout(() => {
        startScreenShare();
      }, 100);
    }
  };

  if (!isSupported) {
    return (
      <div className="screen-share-manager">
        <div className="screen-share-unsupported">
          Screen sharing is not supported in this browser.
        </div>
      </div>
    );
  }

  return (
    <div className="screen-share-manager">
      {/* Screen share controls */}
      <div className="screen-share-controls">
        <div className="share-type-selector">
          <button
            className={`share-type-btn ${shareType === 'screen' ? 'active' : ''}`}
            onClick={() => handleShareTypeChange('screen')}
          >
            🖥️ Screen
          </button>
          <button
            className={`share-type-btn ${shareType === 'window' ? 'active' : ''}`}
            onClick={() => handleShareTypeChange('window')}
          >
            🪟 Window
          </button>
          <button
            className={`share-type-btn ${shareType === 'tab' ? 'active' : ''}`}
            onClick={() => handleShareTypeChange('tab')}
          >
            📑 Tab
          </button>
        </div>

        <button
          className={`screen-share-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        >
          {isScreenSharing ? '⏹️ Stop Sharing' : '📺 Share Screen'}
        </button>
      </div>

      {/* Screen share status */}
      {isScreenSharing && (
        <div className="screen-share-status">
          <div className="sharing-indicator">
            <div className="sharing-dot"></div>
            <span>Sharing your {shareType}</span>
          </div>
          
          <div className="sharing-controls">
            <button 
              className="pause-share-btn"
              onClick={stopScreenShare}
              title="Stop sharing"
            >
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenShareManager;
