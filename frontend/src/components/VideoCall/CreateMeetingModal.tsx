import React, { useState } from 'react';
import axios from 'axios';
import './CreateMeetingModal.css';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMeetingCreated: (meetingId: string, meetingUrl: string) => void;
}

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  isOpen,
  onClose,
  onMeetingCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    settings: {
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
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/videocalls', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        onMeetingCreated(response.data.data.meetingId, response.data.meetingUrl);
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          scheduledTime: '',
          settings: {
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
          }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingKey = name.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                      type === 'number' ? parseInt(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCheckboxChange = (settingKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [settingKey]: checked
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Meeting</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="meeting-form">
          {error && <div className="error-message">{error}</div>}

          {/* Basic Information */}
          <div className="form-section">
            <h3>Meeting Details</h3>
            
            <div className="form-group">
              <label htmlFor="title">Meeting Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Patient Consultation, Team Meeting"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Optional meeting description"
              />
            </div>

            <div className="form-group">
              <label htmlFor="scheduledTime">Scheduled Time (Optional)</label>
              <input
                type="datetime-local"
                id="scheduledTime"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Meeting Settings */}
          <div className="form-section">
            <h3>Meeting Settings</h3>

            <div className="settings-grid">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.allowChat}
                    onChange={(e) => handleCheckboxChange('allowChat', e.target.checked)}
                  />
                  Allow Chat
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.allowScreenShare}
                    onChange={(e) => handleCheckboxChange('allowScreenShare', e.target.checked)}
                  />
                  Allow Screen Share
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.allowRecording}
                    onChange={(e) => handleCheckboxChange('allowRecording', e.target.checked)}
                  />
                  Allow Recording
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.enableTranslation}
                    onChange={(e) => handleCheckboxChange('enableTranslation', e.target.checked)}
                  />
                  Enable Translation
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.enableSubtitles}
                    onChange={(e) => handleCheckboxChange('enableSubtitles', e.target.checked)}
                  />
                  Enable Subtitles
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.waitingRoom}
                    onChange={(e) => handleCheckboxChange('waitingRoom', e.target.checked)}
                  />
                  Waiting Room
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.muteOnEntry}
                    onChange={(e) => handleCheckboxChange('muteOnEntry', e.target.checked)}
                  />
                  Mute on Entry
                </label>
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.settings.disableCameraOnEntry}
                    onChange={(e) => handleCheckboxChange('disableCameraOnEntry', e.target.checked)}
                  />
                  Disable Camera on Entry
                </label>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="defaultLanguage">Default Language</label>
                <select
                  id="defaultLanguage"
                  name="settings.defaultLanguage"
                  value={formData.settings.defaultLanguage}
                  onChange={handleInputChange}
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

              <div className="form-group">
                <label htmlFor="maxParticipants">Max Participants</label>
                <select
                  id="maxParticipants"
                  name="settings.maxParticipants"
                  value={formData.settings.maxParticipants}
                  onChange={handleInputChange}
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

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeetingModal;
