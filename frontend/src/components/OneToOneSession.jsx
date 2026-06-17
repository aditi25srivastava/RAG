import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Loader, Globe, Camera, CameraOff } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { saveToHistory } from '../services/history';

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' }
];

export default function OneToOneSession({ selectedHistory, sessionId, setSessionId, setMessages }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [currentCaption, setCurrentCaption] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (selectedHistory && selectedHistory.type === 'voice') {
      setTranscript(selectedHistory.query);
      setAiResponse(selectedHistory.response);
      setCurrentCaption(selectedHistory.response.split(/\s+/).slice(-6).join(' ')); // Show end of response
      setIsSessionActive(false); // Make sure session is paused when viewing history
    }
  }, [selectedHistory]);

  // Spacebar to interrupt AI
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && isSpeaking) {
        e.preventDefault();
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeaking]);

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setTranscript(currentTranscript => {
          if (currentTranscript.trim()) {
            handleSendQuery(currentTranscript);
          }
          return currentTranscript;
        });
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      synthRef.current.cancel();
    };
  }, [language]);

  // Continuous conversation loop
  useEffect(() => {
    if (isSessionActive && !isLoading && !isListening) {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = language;
          recognitionRef.current.start();
        }
      } catch (e) {
        console.error("Auto-start mic error:", e);
      }
    }
  }, [isSessionActive, isLoading, isListening, language]);

  const toggleSession = () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      recognitionRef.current?.abort();
      synthRef.current.cancel();
      setIsSpeaking(false);
      setCurrentCaption('');
    } else {
      setIsSessionActive(true);
      setTranscript('');
      setAiResponse('');
      setCurrentCaption('');
    }
  };

  const toggleCamera = async () => {
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err) {
        console.error("Camera access denied or unavailable:", err);
        alert("Camera access was denied or is not available.");
      }
    }
  };

  const handleSendQuery = async (text) => {
    if (!text.trim()) return;
    // Instantly interrupt AI if it was speaking
    synthRef.current.cancel();
    setIsSpeaking(false);
    
    setIsLoading(true);
    setAiResponse('');
    setCurrentCaption('');
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      const langName = LANGUAGES.find(l => l.code === language)?.name || 'English';
      // Voice mode prompt: Extremely concise, no markdown, to guarantee instant processing
      const promptText = `[SYSTEM: VOICE MODE. You are speaking out loud. Keep your answer EXTREMELY short (1-3 sentences). Be conversational. DO NOT use markdown, code blocks, or mermaid diagrams. Reply exclusively in ${langName}] ${text}`;
      
      let imageData = null;
      if (isCameraActive && videoRef.current) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          imageData = dataUrl.split(',')[1];
        } catch (err) {
          console.error("Failed to capture image frame:", err);
        }
      }

      const response = await sendChatMessage(sessionId, promptText, imageData);
      if (!sessionId) setSessionId(response.session_id);
      
      // Clean up any rogue formatting just in case
      let spokenText = response.content
        .replace(/[*#_]/g, '')
        .replace(/`[\s\S]*?`/g, '')
        .trim();
      
      setAiResponse(spokenText);
      saveToHistory('voice', text, spokenText);
      speakText(spokenText);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: spokenText,
        citations: response.citations || [],
        confidence: response.confidence_score,
        thought_process: response.thought_process || [],
        suggested_questions: response.suggested_questions || []
      }]);
    } catch (err) {
      console.error(err);
      const errorMsg = "I'm sorry, I encountered an error connecting to the server.";
      speakText(errorMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, confidence: 0 }]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith(language.split('-')[0]) && 
      (v.name.includes('Samantha') || v.name.includes('Ava') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Tessa') || v.name.includes('Female') || v.name.includes('Zira'))) 
      || voices.find(v => v.lang.startsWith(language.split('-')[0]) && (v.name.includes('Premium') || v.name.includes('Google')))
      || voices.find(v => v.lang.startsWith(language.split('-')[0]));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0; // Smooth, understandable, and natural flow
    utterance.pitch = 1.0; // Clear AI tone
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentCaption('');
    };
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const spokenSoFar = text.substring(0, event.charIndex + event.charLength);
        const words = spokenSoFar.trim().split(/\s+/);
        // Show max 6 words (current word + up to 5 preceding words)
        const lastSixWords = words.slice(-6).join(' ');
        setCurrentCaption(lastSixWords);
      }
    };

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="session-container" style={{ position: 'relative' }}>
      
      {/* Language Selector */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Globe size={18} color="var(--text-secondary)" />
        <select 
          className="lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isSessionActive || isLoading || isSpeaking}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      <h2 style={{ marginBottom: '1rem', fontSize: '2.5rem', background: 'linear-gradient(to right, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
        AI Interview Session
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', fontSize: '1.1rem' }}>
        Click Start below to begin a continuous conversation in your native language.
      </p>

      {/* Waveform Visualizer */}
      <div className="waveform-container">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`waveform-bar ${isSpeaking ? 'active' : ''}`} />
        ))}
      </div>

      <div style={{ marginBottom: '3rem', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>
            <Loader className="animate-spin" size={24} /> Processing...
          </div>
        ) : isSpeaking ? (
          <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: '500' }}>
            AI is speaking... (Press Spacebar to interrupt)
          </div>
        ) : isListening && isSessionActive ? (
          <div style={{ color: 'var(--danger-color)', fontSize: '1.2rem', fontWeight: '500' }}>
            Listening: "{transcript}"
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{isSessionActive ? "Waiting for you to speak..." : "Ready to start session."}</div>
        )}
      </div>

      {/* Big Central Button */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
        <button 
          onClick={toggleCamera}
          title={isCameraActive ? "Turn Off Camera" : "Turn On Camera (Vision Mode)"}
          style={{
            background: isCameraActive ? 'var(--accent-primary)' : 'var(--bg-card)',
            color: isCameraActive ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isCameraActive ? '0 4px 15px rgba(59, 130, 246, 0.4)' : '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {isCameraActive ? <Camera size={28} /> : <CameraOff size={28} />}
        </button>

        {!isSessionActive ? (
          <button 
            className="mic-btn-large"
            onClick={toggleSession}
            title="Start Conversation"
          >
            <Mic size={40} />
          </button>
        ) : (
          <button 
            className="mic-btn-large"
            style={{ background: 'var(--danger-color)', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)' }}
            onClick={toggleSession}
            title="Stop Conversation"
          >
            <Square size={36} fill="currentColor" />
          </button>
        )}
      </div>

      {/* Floating Video Preview */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        style={{
          display: isCameraActive ? 'block' : 'none',
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '240px',
          height: '180px',
          borderRadius: '16px',
          border: '2px solid var(--accent-primary)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          objectFit: 'cover',
          zIndex: 1000
        }}
      />

      {/* Live Captions (Karaoke Sentence Style) */}
      {(isSpeaking || currentCaption) && !isListening && !isLoading && (
        <div className="captions-container">
          {currentCaption || "..."}
        </div>
      )}
      
      {!window.SpeechRecognition && !window.webkitSpeechRecognition && (
        <div style={{ marginTop: '2rem', color: 'var(--danger-color)', fontSize: '0.85rem' }}>
          Your browser does not support Speech Recognition. Please use Chrome or Edge.
        </div>
      )}
    </div>
  );
}
