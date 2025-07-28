import React, { useRef, useEffect, useState } from 'react';
import './RecordingManager.css';

// @ts-ignore
import RecordRTC from 'recordrtc';

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

interface RecordingManagerProps {
  isRecording: boolean;
  recordingStatus: string;
  meetingId: string | undefined;
  localStream: MediaStream | null;
  participants: Map<string, Participant>;
}

const RecordingManager: React.FC<RecordingManagerProps> = ({
  isRecording,
  recordingStatus,
  meetingId,
  localStream,
  participants
}) => {
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isRecording && !recorder) {
      startRecording();
    } else if (!isRecording && recorder) {
      stopRecording();
    }
  }, [isRecording, recorder]);

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

  const createMixedStream = () => {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();
    
    // Mix local audio
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const source = audioContext.createMediaStreamSource(localStream);
        source.connect(destination);
      }
    }

    // Mix participant audio
    participants.forEach(participant => {
      if (participant.stream) {
        const audioTracks = participant.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          const source = audioContext.createMediaStreamSource(participant.stream);
          source.connect(destination);
        }
      }
    });

    // Create mixed stream with video from local stream
    const mixedStream = new MediaStream();
    
    // Add mixed audio
    destination.stream.getAudioTracks().forEach(track => {
      mixedStream.addTrack(track);
    });

    // Add local video (or screen share if active)
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        mixedStream.addTrack(videoTracks[0]);
      }
    }

    return mixedStream;
  };

  const startRecording = async () => {
    try {
      // Create mixed stream with all audio/video
      const mixedStream = createMixedStream();
      mixedStreamRef.current = mixedStream;

      // Configure recording options
      const options: any = {
        type: 'video' as const,
        mimeType: 'video/webm;codecs=vp9',
        recorderType: RecordRTC.MediaStreamRecorder,
        video: {
          width: 1920,
          height: 1080,
          frameRate: 30
        },
        audio: {
          sampleRate: 48000,
          channelCount: 2,
          volume: 1.0
        },
        canvas: {
          width: 1920,
          height: 1080
        },
        frameInterval: 90,
        quality: 0.95,
        checkForInactiveTracks: true,
        timeSlice: 1000
      };

      const recordRTC = new RecordRTC(mixedStream, options);
      recordRTC.startRecording();
      setRecorder(recordRTC);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        
        // Save recording file
        saveRecording(blob);
        
        // Clean up
        recorder.destroy();
        setRecorder(null);
        
        if (mixedStreamRef.current) {
          mixedStreamRef.current.getTracks().forEach(track => track.stop());
          mixedStreamRef.current = null;
        }
      });
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
      
      console.log('Recording saved:', fileName);
    } catch (error) {
      console.error('Error saving recording:', error);
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
        console.log('Recording uploaded successfully:', data);
      } else {
        console.error('Failed to upload recording');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
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
          <span className="recording-label">Recording</span>
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

export default RecordingManager;
