import React, { useState, useEffect, useRef } from 'react';
import SocketService from '../../services/socketService';
import axios from 'axios';
import './Chat.css';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatProps {
  appointmentId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({
  appointmentId,
  currentUserId,
  currentUserName,
  currentUserRole,
  otherUserId,
  otherUserName,
  otherUserRole,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketService = SocketService.getInstance();

  useEffect(() => {
    console.log('Chat component mounted for appointment:', appointmentId);
    console.log('Current user:', currentUserId, currentUserName);
    console.log('Other user:', otherUserId, otherUserName);
    
    // Load chat history
    loadChatHistory();
    
    // Create a unique message handler for this chat instance
    const messageHandler = (data: any) => {
      console.log('Received message:', data);
      console.log('Expected appointment:', appointmentId);
      console.log('Message appointment:', data.appointmentId);
      console.log('Current user ID:', currentUserId);
      console.log('Message sender ID:', data.senderId);
      
      // Only process messages for this specific appointment
      if (data.appointmentId === appointmentId) {
        // Only add message if it's not from the current user (to avoid showing own messages twice)
        if (data.senderId !== currentUserId) {
          console.log('Message is for this appointment and from other user, adding to chat');
          const message: Message = {
            id: `${data.senderId}-${Date.now()}`,
            senderId: data.senderId,
            receiverId: data.receiverId,
            senderName: data.senderName,
            message: data.message,
            timestamp: new Date(data.timestamp),
            isOwn: false
          };
          setMessages(prev => [...prev, message]);
        } else {
          console.log('Message is from current user, ignoring to prevent duplicate');
        }
      } else {
        console.log('Message is for different appointment:', data.appointmentId, 'vs', appointmentId);
      }
    };
    
    // Listen for incoming messages
    socketService.onReceiveMessage(messageHandler);

    // Listen for typing indicators
    socketService.onUserTyping((data) => {
      if (data.appointmentId === appointmentId && data.userId === otherUserId) {
        setOtherUserTyping(data.isTyping);
      }
    });

    // Listen for message errors (optional)
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('message_error', (data) => {
        if (data.appointmentId === appointmentId) {
          console.error('Message delivery error:', data.error);
          // You could show a toast notification here
        }
      });

      socket.on('message_sent', (data) => {
        if (data.appointmentId === appointmentId) {
          console.log('Message delivery confirmed:', data.messageId);
          // Message was successfully sent
        }
      });
    }

    return () => {
      // Cleanup is handled by socketService.onReceiveMessage which removes old listeners
      console.log('Chat component unmounting for appointment:', appointmentId);
      if (socket) {
        socket.off('message_error');
        socket.off('message_sent');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, currentUserId, currentUserName, otherUserId, otherUserName]);

  // Load chat history
  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/messages/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const historyMessages = response.data.messages.map((msg: any) => ({
        id: msg._id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: new Date(msg.createdAt),
        isOwn: msg.senderId === currentUserId
      }));
      
      setMessages(historyMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socketService.startTyping(appointmentId, currentUserId, currentUserName, otherUserId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socketService.stopTyping(appointmentId, currentUserId, otherUserId);
      }
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim()) {
      const messageText = newMessage.trim();
      const timestamp = new Date();
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketService.stopTyping(appointmentId, currentUserId, otherUserId);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
      
      // Add message to local state immediately for sender
      const message: Message = {
        id: `${currentUserId}-${timestamp.getTime()}`,
        senderId: currentUserId,
        receiverId: otherUserId,
        senderName: currentUserName,
        message: messageText,
        timestamp: timestamp,
        isOwn: true
      };

      console.log('Sending message:', message);
      setMessages(prev => [...prev, message]);

      // Send message via socket
      socketService.sendMessage(
        appointmentId,
        currentUserId,
        otherUserId,
        messageText,
        currentUserName
      );

      setNewMessage('');
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp: Date) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="user-avatar">
            {otherUserRole === 'doctor' ? '👨‍⚕️' : '🏃‍♂️'}
          </div>
          <div className="user-details">
            <h3>{otherUserName}</h3>
            <p className="user-role">{otherUserRole.charAt(0).toUpperCase() + otherUserRole.slice(1)}</p>
          </div>
        </div>
        <div className="chat-actions">
          <button 
            className="video-call-btn"
            onClick={() => {
              // This will be handled by parent component
              const event = new CustomEvent('startVideoCall', {
                detail: {
                  appointmentId,
                  currentUserId,
                  currentUserName,
                  currentUserRole,
                  otherUserId,
                  otherUserName
                }
              });
              window.dispatchEvent(event);
            }}
            title="Start Video Call"
          >
            📹
          </button>
          <button className="close-chat-btn" onClick={onClose} title="Close Chat">
            ✕
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {isLoading ? (
          <div className="loading-messages">
            <div className="loading-spinner">⏳</div>
            <p>Loading chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">💬</div>
            <p>Start a conversation with {otherUserName}</p>
            <p className="empty-chat-subtitle">
              Send a message to begin your consultation chat
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
              
              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="date-separator">
                      <span>{formatDate(message.timestamp)}</span>
                    </div>
                  )}
                  <div className={`message ${message.isOwn ? 'own' : 'other'}`}>
                    <div className="message-content">
                      <p>{message.message}</p>
                      <span className="message-time">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    {!message.isOwn && (
                      <div className="message-sender">
                        {message.senderName}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
            {otherUserTyping && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">{otherUserName} is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="chat-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="chat-input"
            maxLength={500}
          />
          <button 
            type="submit" 
            className="send-btn"
            disabled={!newMessage.trim()}
          >
            <span className="send-icon">📤</span>
          </button>
        </div>
        <div className="chat-input-info">
          <span className="char-count">
            {newMessage.length}/500
          </span>
          <span className="chat-tips">
            Press Enter to send
          </span>
        </div>
      </form>
    </div>
  );
};

export default Chat;
