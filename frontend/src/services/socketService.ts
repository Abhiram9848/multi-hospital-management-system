import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(userId: string, userRole: string, userName: string): void {
    if (!this.socket || this.socket.disconnected) {
      console.log('=== CREATING NEW SOCKET CONNECTION ===');
      this.socket = io(SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('Connected to server with socket ID:', this.socket?.id);
        console.log('Joining as:', { userId, userRole, userName });
        this.socket?.emit('join', { userId, userRole, userName });
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    } else if (this.socket.connected) {
      console.log('=== REUSING EXISTING CONNECTION ===');
      console.log('Socket ID:', this.socket.id);
      // Re-join in case connection was lost
      this.socket.emit('join', { userId, userRole, userName });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat methods
  public sendMessage(appointmentId: string, senderId: string, receiverId: string, message: string, senderName: string): void {
    if (this.socket) {
      console.log('Sending message:', { appointmentId, senderId, receiverId, message, senderName });
      this.socket.emit('send_message', {
        appointmentId,
        senderId,
        receiverId,
        message,
        senderName
      });
    } else {
      console.error('Socket not connected - cannot send message');
    }
  }

  public onReceiveMessage(callback: (data: any) => void): void {
    if (this.socket) {
      // Remove existing listeners to prevent duplicates
      this.socket.off('receive_message');
      this.socket.on('receive_message', callback);
    }
  }

  // Video call methods
  public callUser(appointmentId: string, callerId: string, callerName: string, receiverId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('=== CALLING USER ===');
      console.log('Appointment ID:', appointmentId);
      console.log('Caller ID:', callerId);
      console.log('Caller Name:', callerName);
      console.log('Receiver ID:', receiverId);
      console.log('Socket ID:', this.socket.id);
      
      this.socket.emit('call_user', {
        appointmentId,
        callerId,
        callerName,
        receiverId
      });
    } else {
      console.error('Socket not connected - cannot make call');
      console.log('Socket state:', this.socket ? 'exists but disconnected' : 'null');
    }
  }

  public answerCall(appointmentId: string, callerId: string, signal: any): void {
    if (this.socket) {
      console.log('=== ANSWERING CALL ===');
      console.log('Appointment ID:', appointmentId);
      console.log('Caller ID:', callerId);
      console.log('Signal:', signal);
      this.socket.emit('answer_call', {
        appointmentId,
        callerId,
        signal
      });
    }
  }

  public rejectCall(callerId: string): void {
    if (this.socket) {
      this.socket.emit('reject_call', { callerId });
    }
  }

  public endCall(appointmentId: string): void {
    if (this.socket) {
      this.socket.emit('end_call', { appointmentId });
    }
  }

  // WebRTC signaling
  public sendSignal(appointmentId: string, signal: any, targetUserId: string): void {
    if (this.socket) {
      console.log('Sending signal to:', targetUserId);
      this.socket.emit('signal', { appointmentId, signal, targetUserId });
    }
  }

  public onSignal(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('signal');
      this.socket.on('signal', callback);
    }
  }

  // Event listeners
  public onIncomingCall(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('incoming_call');
      this.socket.on('incoming_call', callback);
    }
  }

  public onCallAccepted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('call_accepted');
      this.socket.on('call_accepted', callback);
    }
  }

  public onCallRejected(callback: () => void): void {
    if (this.socket) {
      this.socket.off('call_rejected');
      this.socket.on('call_rejected', callback);
    }
  }

  public onCallEnded(callback: () => void): void {
    if (this.socket) {
      this.socket.off('call_ended');
      this.socket.on('call_ended', callback);
    }
  }

  public onCallFailed(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('call_failed');
      this.socket.on('call_failed', callback);
    }
  }

  // Typing indicators
  public startTyping(appointmentId: string, userId: string, userName: string, receiverId: string): void {
    if (this.socket) {
      this.socket.emit('typing_start', { appointmentId, userId, userName, receiverId });
    }
  }

  public stopTyping(appointmentId: string, userId: string, receiverId: string): void {
    if (this.socket) {
      this.socket.emit('typing_stop', { appointmentId, userId, receiverId });
    }
  }

  public onUserTyping(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('user_typing');
      this.socket.on('user_typing', callback);
    }
  }

  // Remove event listeners
  public removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export default SocketService;
