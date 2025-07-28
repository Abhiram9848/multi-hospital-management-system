import React, { useRef, useEffect, useState } from 'react';
import Peer from 'simple-peer';
import SocketService from '../../services/socketService';
import './VideoCall.css';

interface VideoCallProps {
  appointmentId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  otherUserId: string;
  otherUserName: string;
  isInitiator: boolean;
  onClose: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  appointmentId,
  currentUserId,
  currentUserName,
  currentUserRole,
  otherUserId,
  otherUserName,
  isInitiator,
  onClose
}) => {
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState(isInitiator ? 'calling' : 'incoming');

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const pendingSignalRef = useRef<any>(null);
  const socketService = SocketService.getInstance();

  // Helper function to safely set and play video stream
  const setVideoStream = (videoElement: HTMLVideoElement, stream: MediaStream, label: string) => {
    return new Promise<void>((resolve, reject) => {
      // Pause any existing playback
      videoElement.pause();
      
      // Set the new stream
      videoElement.srcObject = stream;
      
      // Wait a bit before playing to avoid interruption
      setTimeout(() => {
        videoElement.play().then(() => {
          console.log(`${label} video stream set and playing successfully`);
          resolve();
        }).catch(error => {
          console.log(`Error playing ${label} video:`, error);
          reject(error);
        });
      }, 100);
    });
  };

  useEffect(() => {
    console.log('VideoCall component mounted');
    console.log('Appointment ID:', appointmentId);
    console.log('Current user:', currentUserId, currentUserName, currentUserRole);
    console.log('Other user:', otherUserId, otherUserName);
    console.log('Is initiator:', isInitiator);
    
    // Test polyfills on component mount
    if (typeof process === 'undefined') {
      console.error('Process polyfill not loaded');
      alert('Browser compatibility issue detected. Please refresh the page.');
      return;
    }

    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          setVideoStream(myVideo.current, currentStream, 'Local').catch(console.error);
        }

        if (isInitiator) {
          // Create peer as initiator
          const peerInstance = new Peer({
            initiator: true,
            trickle: false,
            stream: currentStream,
          });

          peerInstance.on('signal', (signal: any) => {
            socketService.sendSignal(appointmentId, signal, otherUserId);
          });

          peerInstance.on('stream', (userStream: MediaStream) => {
            console.log('Received stream from peer (initiator)');
            console.log('Stream tracks:', userStream.getTracks().map(track => `${track.kind}: ${track.enabled}`));
            if (userVideo.current) {
              setVideoStream(userVideo.current, userStream, 'Remote (initiator)').catch(console.error);
            }
          });

          peerInstance.on('connect', () => {
            console.log('=== INITIATOR PEER CONNECTED ===');
            console.log('P2P connection established');
          });

          peerInstance.on('error', (err) => {
            console.error('=== INITIATOR PEER ERROR ===', err);
          });

          peerInstance.on('close', () => {
            console.log('=== INITIATOR PEER CLOSED ===');
          });

          setPeer(peerInstance);

          // Process any pending signal from call acceptance
          if (pendingSignalRef.current) {
            console.log('Processing pending call accepted signal');
            peerInstance.signal(pendingSignalRef.current);
            pendingSignalRef.current = null;
          }

          // Call the other user with a small delay to ensure socket is ready
          console.log('Initiating call to:', otherUserId, otherUserName);
          setTimeout(() => {
            socketService.callUser(appointmentId, currentUserId, currentUserName, otherUserId);
          }, 500);
        }
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        alert('Could not access camera/microphone. Please check permissions.');
      });

    // Socket event listeners
    socketService.onCallAccepted((data) => {
      console.log('=== CALL ACCEPTED EVENT RECEIVED ===');
      console.log('Data:', data);
      console.log('Current appointment ID:', appointmentId);
      console.log('Data appointment ID:', data.appointmentId);
      console.log('Current peer:', peer);
      
      if (data.appointmentId === appointmentId) {
        console.log('Call accepted for this appointment - updating state');
        setCallAccepted(true);
        setCallStatus('connected');
        
        // Signal the peer with the receiver's answer
        if (peer && data.signal) {
          console.log('Signaling initiator peer with answer signal');
          console.log('Signal type:', data.signal.type);
          console.log('Peer state:', peer.destroyed ? 'destroyed' : 'active');
          try {
            peer.signal(data.signal);
            console.log('Signal sent successfully to initiator peer');
          } catch (error) {
            console.error('Error signaling initiator peer:', error);
          }
        } else {
          console.log('No peer or signal available:', { peer: !!peer, signal: !!data.signal });
          if (!peer) {
            console.log('Peer not available - storing signal for later');
            // Store the signal to process when peer is available
            pendingSignalRef.current = data.signal;
          }
          if (!data.signal) console.log('Signal not provided in call_accepted event');
        }
      } else {
        console.log('Call accepted but for different appointment');
      }
    });

    socketService.onSignal((data) => {
      console.log('Received WebRTC signal:', data);
      if (data.appointmentId === appointmentId && data.fromUserId === otherUserId) {
        console.log('Signal is for this call, processing...');
        if (peer) {
          console.log('Signaling existing peer');
          peer.signal(data.signal);
        } else {
          console.log('No peer exists yet - signal will be processed when peer is created');
          // Store the signal to process it when peer is created
          pendingSignalRef.current = data.signal;
        }
      }
    });

    socketService.onCallEnded(() => {
      console.log('Call ended event received');
      setCallEnded(true);
      setCallStatus('ended');
      cleanup();
      onClose();
    });

    socketService.onCallFailed((data) => {
      console.log('Call failed:', data);
      alert(`Call failed: ${data.reason}`);
      setCallStatus('failed');
      onClose();
    });

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, currentUserId, otherUserId, isInitiator]);

  const answerCall = () => {
    console.log('Answering call...');
    setCallAccepted(true);
    setCallStatus('connected');
    
    if (stream && !peer) {
      console.log('Creating peer connection for receiver');
      const peerInstance = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });

      peerInstance.on('signal', (signal: any) => {
        console.log('=== RECEIVER PEER SIGNAL ===');
        console.log('Signal type:', signal.type);
        console.log('Signal data:', signal);
        console.log('Will answer call with appointment:', appointmentId, 'caller:', otherUserId);
        socketService.answerCall(appointmentId, otherUserId, signal);
      });

      peerInstance.on('stream', (userStream: MediaStream) => {
        console.log('Received stream from peer (answer)');
        console.log('Stream tracks:', userStream.getTracks().map(track => `${track.kind}: ${track.enabled}`));
        if (userVideo.current) {
          setVideoStream(userVideo.current, userStream, 'Remote (receiver)').catch(console.error);
        }
      });

      peerInstance.on('connect', () => {
        console.log('=== RECEIVER PEER CONNECTED ===');
        console.log('P2P connection established');
      });

      peerInstance.on('error', (err) => {
        console.error('=== RECEIVER PEER ERROR ===', err);
      });

      peerInstance.on('close', () => {
        console.log('=== RECEIVER PEER CLOSED ===');
      });

      setPeer(peerInstance);

      // Process any pending signal from the initiator
      if (pendingSignalRef.current) {
        console.log('Processing pending signal');
        peerInstance.signal(pendingSignalRef.current);
        pendingSignalRef.current = null;
      }
    }
  };

  const rejectCall = () => {
    socketService.rejectCall(otherUserId);
    setCallEnded(true);
    onClose();
  };

  const cleanup = () => {
    console.log('Cleaning up video call resources');
    
    // Clear any pending signals
    pendingSignalRef.current = null;
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      setStream(null);
    }
    
    if (peer && !peer.destroyed) {
      peer.destroy();
      console.log('Destroyed peer connection');
    }
    setPeer(null);
    
    // Clear video elements
    if (myVideo.current) {
      myVideo.current.srcObject = null;
    }
    if (userVideo.current) {
      userVideo.current.srcObject = null;
    }
    
    // DON'T remove all socket listeners as it affects other components
    // socketService.removeAllListeners();
  };

  const endCall = () => {
    console.log('Ending call');
    setCallEnded(true);
    setCallStatus('ended');
    socketService.endCall(appointmentId);
    cleanup();
    onClose();
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <h3>
          {callStatus === 'incoming' && 'Incoming Call from '}
          {callStatus === 'calling' && 'Calling '}
          {callStatus === 'connected' && 'Connected with '}
          {otherUserName}
        </h3>
        <div className="call-status">
          <span className={`status-indicator ${callStatus}`}></span>
          {callStatus === 'calling' && 'Ringing...'}
          {callStatus === 'incoming' && 'Incoming Call'}
          {callStatus === 'connected' && 'Connected'}
          {callStatus === 'ended' && 'Call Ended'}
        </div>
      </div>

      <div className="video-container">
        <div className="video-wrapper">
          <video
            ref={myVideo}
            autoPlay
            muted
            className="my-video"
            playsInline
          />
          <div className="video-label">You ({currentUserRole})</div>
        </div>

        {/* Always show remote video area for debugging */}
        <div className="video-wrapper">
          <video
            ref={userVideo}
            autoPlay
            className="user-video"
            playsInline
            style={{
              backgroundColor: (callAccepted && !callEnded) ? 'transparent' : '#333',
              opacity: (callAccepted && !callEnded) ? 1 : 0.5
            }}
          />
          <div className="video-label">
            {otherUserName} {!(callAccepted && !callEnded) && '(Waiting...)'}
          </div>
        </div>
        
        {/* Debug info */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px', fontSize: '12px' }}>
          <div>Call Accepted: {callAccepted ? 'Yes' : 'No'}</div>
          <div>Call Ended: {callEnded ? 'Yes' : 'No'}</div>
          <div>Call Status: {callStatus}</div>
          <div>Peer: {peer ? 'Connected' : 'None'}</div>
          <div>Stream: {stream ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div className="call-controls">
        {callStatus === 'incoming' && !callAccepted && (
          <div className="incoming-call-controls">
            <button className="answer-btn" onClick={answerCall}>
              📞 Answer
            </button>
            <button className="reject-btn" onClick={rejectCall}>
              📞 Reject
            </button>
          </div>
        )}

        {(callAccepted || callStatus === 'calling') && !callEnded && (
          <div className="active-call-controls">
            <button
              className={`control-btn ${isVideoEnabled ? 'enabled' : 'disabled'}`}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? '📹' : '📹'}
            </button>
            <button
              className={`control-btn ${isAudioEnabled ? 'enabled' : 'disabled'}`}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? '🎤' : '🔇'}
            </button>
            <button className="end-call-btn" onClick={endCall}>
              📞 End Call
            </button>
          </div>
        )}

        {callStatus === 'calling' && (
          <button className="cancel-call-btn" onClick={endCall}>
            Cancel Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
