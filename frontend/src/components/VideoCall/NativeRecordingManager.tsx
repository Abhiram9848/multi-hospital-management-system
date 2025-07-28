import React, { useRef, useEffect, useState } from 'react';
import './RecordingManager.css';

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

interface NativeRecordingManagerProps {
  isRecording: boolean;
  recordingStatus: string;
  meetingId: string | undefined;
  localStream: MediaStream | null;
  participants: Map<string, Participant>;
}

const NativeRecordingManager: React.FC<NativeRecordingManagerProps> = ({
  isRecording,
  recordingStatus,
  meetingId,
  localStream,
  participants
}) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isRecording && !mediaRecorder) {
      startNativeRecording();
    } else if (!isRecording && mediaRecorder) {
      stopNativeRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, mediaRecorder]);

  useEffect(() => {
    if (isRecording) {
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Stop timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const startNativeRecording = async () => {
    try {
      if (!localStream) {
        console.error('No local stream available for recording');
        return;
      }

      // Use the native MediaRecorder API
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      };

      // Fallback to supported format if vp9 is not available
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
          options.mimeType = 'video/webm';
          if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            options.mimeType = 'video/mp4';
          }
        }
      }

      const recorder = new MediaRecorder(localStream, options);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType
        });
        saveRecording(blob);
      };

      recorder.start(1000); // Capture data every second
      setMediaRecorder(recorder);

      console.log('Native recording started with format:', recorder.mimeType);
    } catch (error) {
      console.error('Error starting native recording:', error);
    }
  };

  const stopNativeRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  const saveRecording = async (blob: Blob) => {
    try {
      // Create download link
      const url = URL.createObjectURL(blob);
      const fileName = `meeting-${meetingId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      
      // Auto-download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Optional: Upload to server
      await uploadRecording(blob, fileName);
      
      console.log('Native recording saved:', fileName);
    } catch (error) {
      console.error('Error saving native recording:', error);
    }
  };

  const uploadRecording = async (blob: Blob, fileName: string) => {
    try {
      const formData = new FormData();
      formData.append('recording', blob, fileName);
      formData.append('meetingId', meetingId || '');

      const response = await fetch('/api/videocalls/upload-recording', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Native recording uploaded successfully:', data);
      } else {
        console.error('Failed to upload native recording');
      }
    } catch (error) {
      console.error('Error uploading native recording:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording && recordingStatus === 'not-started') {
    return null;
  }

  return (
    <div className="recording-manager">
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <span className="recording-label">Recording (Native)</span>
          <span className="recording-time">{formatTime(recordingTime)}</span>
        </div>
      )}

      {recordingStatus === 'processing' && (
        <div className="recording-processing">
          <div className="processing-spinner"></div>
          <span>Processing recording...</span>
        </div>
      )}

      {recordingStatus === 'completed' && (
        <div className="recording-completed">
          <span>✓ Recording saved</span>
        </div>
      )}
    </div>
  );
};

export default NativeRecordingManager;
