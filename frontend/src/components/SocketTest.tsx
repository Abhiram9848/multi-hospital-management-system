import React, { useState, useEffect } from 'react';
import SocketService from '../services/socketService';

const SocketTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  // const [users, setUsers] = useState<any[]>([]);
  const socketService = SocketService.getInstance();

  useEffect(() => {
    // Get current user data
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      socketService.connect(user._id, user.role, user.name);
      
      // Check connection status
      const socket = socketService.getSocket();
      if (socket) {
        setIsConnected(socket.connected);
        setSocketId(socket.id || '');
        
        socket.on('connect', () => {
          setIsConnected(true);
          setSocketId(socket.id || '');
        });
        
        socket.on('disconnect', () => {
          setIsConnected(false);
          setSocketId('');
        });
      }
      
      // Listen for test messages
      socketService.onReceiveMessage((data) => {
        setReceivedMessages(prev => [...prev, `${data.senderName}: ${data.message} (${new Date().toLocaleTimeString()})`]);
      });
    }
  }, [socketService]);

  const sendTestMessage = () => {
    const userData = localStorage.getItem('user');
    if (userData && testMessage.trim()) {
      const user = JSON.parse(userData);
      // Send to a test appointment ID
      socketService.sendMessage('test-appointment', user._id, 'test-receiver', testMessage, user.name);
      setTestMessage('');
    }
  };

  const testCall = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      socketService.callUser('test-appointment', user._id, user.name, 'test-receiver');
    }
  };

  const clearMessages = () => {
    setReceivedMessages([]);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h3>🔌 Socket Test Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Socket ID:</strong> {socketId || 'N/A'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Test message"
          style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
        />
        <button onClick={sendTestMessage} style={{ width: '100%', padding: '5px', marginBottom: '5px' }}>
          Send Test Message
        </button>
        <button onClick={testCall} style={{ width: '100%', padding: '5px', marginBottom: '5px' }}>
          Test Call
        </button>
        <button onClick={clearMessages} style={{ width: '100%', padding: '5px' }}>
          Clear Messages
        </button>
      </div>
      
      <div>
        <strong>Received Messages:</strong>
        <div style={{ 
          maxHeight: '150px', 
          overflowY: 'auto', 
          border: '1px solid #eee', 
          padding: '5px', 
          fontSize: '12px',
          marginTop: '5px'
        }}>
          {receivedMessages.length === 0 ? (
            <em>No messages received</em>
          ) : (
            receivedMessages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>{msg}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SocketTest;
