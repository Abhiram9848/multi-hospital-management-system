import React, { useState } from 'react';

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

interface ControlPanelProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isHost: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRaiseHand: () => void;
  onLeaveMeeting: () => void;
  settings: VideoCallSettings;
  onUpdateSettings: (settings: VideoCallSettings) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isRecording,
  isHost,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onStartRecording,
  onStopRecording,
  onRaiseHand,
  onLeaveMeeting,
  settings,
  onUpdateSettings
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const handleRaiseHand = () => {
    setHandRaised(!handRaised);
    onRaiseHand();
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const updateSetting = (key: keyof VideoCallSettings, value: any) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  return (
    <>
      <div className="control-panel">
        {/* Audio Control */}
        <button
          className={`control-btn ${isMuted ? 'danger' : ''}`}
          onClick={onToggleAudio}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
          <div className="control-btn-tooltip">
            {isMuted ? 'Unmute' : 'Mute'}
          </div>
        </button>

        {/* Video Control */}
        <button
          className={`control-btn ${isCameraOff ? 'danger' : ''}`}
          onClick={onToggleVideo}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? '📷' : '📹'}
          <div className="control-btn-tooltip">
            {isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          </div>
        </button>

        {/* Screen Share Control */}
        {settings.allowScreenShare && (
          <button
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            📺
            <div className="control-btn-tooltip">
              {isScreenSharing ? 'Stop sharing' : 'Share screen'}
            </div>
          </button>
        )}

        {/* Recording Control (Host only) */}
        {isHost && settings.allowRecording && (
          <button
            className={`control-btn ${isRecording ? 'recording' : ''}`}
            onClick={handleRecordingToggle}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            ⏺️
            <div className="control-btn-tooltip">
              {isRecording ? 'Stop recording' : 'Start recording'}
            </div>
          </button>
        )}

        {/* Raise Hand */}
        <button
          className={`control-btn ${handRaised ? 'active' : ''}`}
          onClick={handleRaiseHand}
          title={handRaised ? 'Lower hand' : 'Raise hand'}
        >
          ✋
          <div className="control-btn-tooltip">
            {handRaised ? 'Lower hand' : 'Raise hand'}
          </div>
        </button>

        {/* Settings (Host only) */}
        {isHost && (
          <button
            className="control-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
            <div className="control-btn-tooltip">Settings</div>
          </button>
        )}

        {/* More Options */}
        <button
          className="control-btn"
          title="More options"
        >
          ⋯
          <div className="control-btn-tooltip">More options</div>
        </button>

        {/* Leave Meeting */}
        <button
          className="leave-btn"
          onClick={onLeaveMeeting}
        >
          Leave
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && isHost && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Meeting Settings</h3>
            <button 
              className="settings-close"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>
          </div>

          <div className="settings-content">
            <div className="settings-section">
              <h4>General</h4>
              
              <div className="settings-option">
                <label>Allow Chat</label>
                <div 
                  className={`settings-toggle ${settings.allowChat ? 'active' : ''}`}
                  onClick={() => updateSetting('allowChat', !settings.allowChat)}
                />
              </div>

              <div className="settings-option">
                <label>Allow Screen Share</label>
                <div 
                  className={`settings-toggle ${settings.allowScreenShare ? 'active' : ''}`}
                  onClick={() => updateSetting('allowScreenShare', !settings.allowScreenShare)}
                />
              </div>

              <div className="settings-option">
                <label>Allow Recording</label>
                <div 
                  className={`settings-toggle ${settings.allowRecording ? 'active' : ''}`}
                  onClick={() => updateSetting('allowRecording', !settings.allowRecording)}
                />
              </div>

              <div className="settings-option">
                <label>Waiting Room</label>
                <div 
                  className={`settings-toggle ${settings.waitingRoom ? 'active' : ''}`}
                  onClick={() => updateSetting('waitingRoom', !settings.waitingRoom)}
                />
              </div>
            </div>

            <div className="settings-section">
              <h4>Audio & Video</h4>
              
              <div className="settings-option">
                <label>Mute on Entry</label>
                <div 
                  className={`settings-toggle ${settings.muteOnEntry ? 'active' : ''}`}
                  onClick={() => updateSetting('muteOnEntry', !settings.muteOnEntry)}
                />
              </div>

              <div className="settings-option">
                <label>Disable Camera on Entry</label>
                <div 
                  className={`settings-toggle ${settings.disableCameraOnEntry ? 'active' : ''}`}
                  onClick={() => updateSetting('disableCameraOnEntry', !settings.disableCameraOnEntry)}
                />
              </div>
            </div>

            <div className="settings-section">
              <h4>Translation & Accessibility</h4>
              
              <div className="settings-option">
                <label>Enable Translation</label>
                <div 
                  className={`settings-toggle ${settings.enableTranslation ? 'active' : ''}`}
                  onClick={() => updateSetting('enableTranslation', !settings.enableTranslation)}
                />
              </div>

              <div className="settings-option">
                <label>Enable Subtitles</label>
                <div 
                  className={`settings-toggle ${settings.enableSubtitles ? 'active' : ''}`}
                  onClick={() => updateSetting('enableSubtitles', !settings.enableSubtitles)}
                />
              </div>

              <div className="settings-option">
                <label>Default Language</label>
                <select 
                  className="settings-select"
                  value={settings.defaultLanguage}
                  onChange={(e) => updateSetting('defaultLanguage', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h4>Participant Management</h4>
              
              <div className="settings-option">
                <label>Max Participants</label>
                <select 
                  className="settings-select"
                  value={settings.maxParticipants}
                  onChange={(e) => updateSetting('maxParticipants', parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ControlPanel;
