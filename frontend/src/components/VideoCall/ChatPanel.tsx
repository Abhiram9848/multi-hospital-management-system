import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  senderId: string;
  message: string;
  timestamp: Date;
  translations?: Array<{ language: string; text: string }>;
  senderName?: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  selectedLanguage: string;
  enableTranslation: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  selectedLanguage,
  enableTranslation,
  onClose
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTranslatedText = (message: ChatMessage) => {
    if (!enableTranslation || !message.translations) {
      return null;
    }

    const translation = message.translations.find(
      t => t.language === selectedLanguage
    );

    return translation?.text;
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Meeting Chat</h3>
        <button className="chat-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => {
          const translatedText = getTranslatedText(message);
          
          return (
            <div key={index} className="chat-message">
              <div className="chat-message-header">
                <span className="chat-sender">
                  {message.senderName || `User ${message.senderId}`}
                </span>
                <span className="chat-timestamp">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              
              <div className="chat-text">
                {message.message}
              </div>

              {translatedText && translatedText !== message.message && (
                <div className="chat-translation">
                  <div className="chat-translation-label">
                    Translation ({selectedLanguage}):
                  </div>
                  <div className="chat-translation-text">
                    {translatedText}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
