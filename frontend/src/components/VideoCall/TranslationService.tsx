import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import './TranslationService.css';

interface TranslationServiceProps {
  socket: Socket | null;
  meetingId: string | undefined;
  selectedLanguage: string;
  onSubtitleGenerated: (text: string, language: string, confidence: number) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResult {
  [key: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [key: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const TranslationService: React.FC<TranslationServiceProps> = ({
  socket,
  meetingId,
  selectedLanguage,
  onSubtitleGenerated
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const lastTranscriptRef = useRef<string>('');
  const translationCacheRef = useRef<Map<string, Map<string, string>>>(new Map());

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognitionInstance = new SpeechRecognition();
      
      // Configure speech recognition
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = selectedLanguage || 'en-US';

      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Restart if it was supposed to be continuous
        if (isListening) {
          setTimeout(() => {
            try {
              recognitionInstance.start();
            } catch (error) {
              console.log('Could not restart speech recognition:', error);
            }
          }, 100);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onresult = async (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript;
          }
        }

        // Process final transcript
        if (finalTranscript && finalTranscript !== lastTranscriptRef.current) {
          lastTranscriptRef.current = finalTranscript;
          const confidence = event.results[event.results.length - 1][0].confidence || 0.8;
          
          // Generate subtitle with translation
          await handleTranscriptGenerated(finalTranscript.trim(), selectedLanguage, confidence);
        }
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported in this browser');
      setIsSupported(false);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  const handleTranscriptGenerated = async (text: string, language: string, confidence: number) => {
    if (!text || text.length < 3) return; // Ignore very short texts

    try {
      // Check cache first
      const languageCache = translationCacheRef.current.get(text);
      if (languageCache && languageCache.has(selectedLanguage)) {
        const cachedTranslation = languageCache.get(selectedLanguage);
        if (cachedTranslation) {
          onSubtitleGenerated(cachedTranslation, language, confidence);
          return;
        }
      }

      // Translate if needed and generate subtitle
      if (language !== selectedLanguage) {
        const translation = await translateText(text, language, selectedLanguage);
        if (translation) {
          // Cache the translation
          if (!translationCacheRef.current.has(text)) {
            translationCacheRef.current.set(text, new Map());
          }
          translationCacheRef.current.get(text)?.set(selectedLanguage, translation);
          
          onSubtitleGenerated(translation, selectedLanguage, confidence * 0.9);
        } else {
          // Fallback to original text
          onSubtitleGenerated(text, language, confidence);
        }
      } else {
        onSubtitleGenerated(text, language, confidence);
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      // Fallback to original text
      onSubtitleGenerated(text, language, confidence);
    }
  };

  const translateText = async (text: string, fromLang: string, toLang: string): Promise<string | null> => {
    if (!socket || !meetingId) return null;

    try {
      // Use Google Translate API through backend
      const response = await fetch('/api/videocalls/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text,
          from: fromLang,
          to: toLang
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.translation;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }

    return null;
  };

  const startListening = () => {
    if (recognition && isSupported) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Could not start speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Auto-start when component mounts if supported
  useEffect(() => {
    if (isSupported && recognition) {
      startListening();
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition, isSupported]);

  if (!isSupported) {
    return (
      <div className="translation-service-unsupported">
        <p>Speech recognition not supported in this browser. Subtitles will not be available.</p>
      </div>
    );
  }

  return (
    <div className="translation-service">
      {/* Listening indicator */}
      {isListening && (
        <div className="listening-indicator">
          <div className="listening-animation">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
          <span>Listening...</span>
        </div>
      )}

      {/* Manual control button (hidden by default, can be shown for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          className={`speech-control ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '🎙️ Stop' : '🎙️ Start'}
        </button>
      )}
    </div>
  );
};

export default TranslationService;
