import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinMeetingModal.css';

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({
  isOpen,
  onClose
}) => {
  const [meetingId, setMeetingId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!meetingId.trim()) {
      setError('Please enter a meeting ID');
      return;
    }

    // Clean and validate meeting ID format
    const cleanMeetingId = meetingId.trim().toLowerCase();
    
    // Expected format: xxx-xxx-xxx (3 letters + number each group)
    const meetingIdPattern = /^[a-z]{3}\d-[a-z]{3}\d-[a-z]{3}\d$/;
    
    if (!meetingIdPattern.test(cleanMeetingId)) {
      setError('Invalid meeting ID format. Expected format: abc1-def2-ghi3');
      return;
    }

    // Navigate to meeting room
    navigate(`/video-call/${cleanMeetingId}`);
    onClose();
  };

  const formatMeetingId = (value: string) => {
    // Remove any non-alphanumeric characters except hyphens
    let cleaned = value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    
    // Remove existing hyphens to reformat
    cleaned = cleaned.replace(/-/g, '');
    
    // Add hyphens every 4 characters
    if (cleaned.length > 4) {
      cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    }
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9) + '-' + cleaned.substring(9);
    }
    
    // Limit to 12 characters (xxx-xxx-xxx format)
    return cleaned.substring(0, 12);
  };

  const handleMeetingIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatMeetingId(e.target.value);
    setMeetingId(formatted);
    setError('');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      // Extract meeting ID from URL if pasted
      const urlMatch = text.match(/\/video-call\/([a-z0-9-]+)/i);
      if (urlMatch) {
        const extractedId = urlMatch[1];
        setMeetingId(formatMeetingId(extractedId));
      } else {
        setMeetingId(formatMeetingId(text));
      }
      
      setError('');
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('Failed to read from clipboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Join Meeting</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="meetingId">Meeting ID</label>
            <div className="input-group">
              <input
                type="text"
                id="meetingId"
                value={meetingId}
                onChange={handleMeetingIdChange}
                placeholder="abc1-def2-ghi3"
                maxLength={12}
                required
              />
              <button
                type="button"
                className="paste-btn"
                onClick={handlePasteFromClipboard}
                title="Paste from clipboard"
              >
                📋
              </button>
            </div>
            <div className="help-text">
              Enter the meeting ID provided by the host
            </div>
          </div>

          <div className="meeting-examples">
            <h4>Meeting ID Format:</h4>
            <div className="format-example">
              <code>abc1-def2-ghi3</code>
              <span>3 letters + 1 number per group</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!meetingId.trim()}>
              Join Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinMeetingModal;
