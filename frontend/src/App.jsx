import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import DocumentUploader from './components/DocumentUploader';
import OneToOneSession from './components/OneToOneSession';
import { fetchDocuments } from './services/api';
import { getHistory } from './services/history';
import { Database, FileText, Activity, BrainCircuit, MessageSquare, Mic, Clock } from 'lucide-react';

function App() {
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'session'
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  
  // Unified Session State
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    loadDocuments();
    loadHistory();

    const handleHistoryUpdate = () => loadHistory();
    window.addEventListener('history_updated', handleHistoryUpdate);
    return () => window.removeEventListener('history_updated', handleHistoryUpdate);
  }, []);

  const handleHistoryClick = (item) => {
    setCurrentView(item.type === 'voice' ? 'session' : 'chat');
    setSelectedHistoryItem({ ...item, _t: Date.now() }); // Force refresh even if clicking same item
  };

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  };

  const loadHistory = () => {
    setHistory(getHistory());
  };

  const handleUploadSuccess = (doc) => {
    setDocuments(prev => [...prev, doc]);
  };

  return (
    <div className="app-container">
      {/* Background decoration */}
      <div className="app-bg"></div>

      <div className="panel sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <BrainCircuit size={28} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>ResearchGPT <span style={{ color: 'var(--accent-primary)', fontWeight: '800' }}>Pro</span></h1>
        </div>
        
        <div className="sidebar-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <button 
              onClick={() => setCurrentView('chat')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: currentView === 'chat' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: currentView === 'chat' ? '1px solid var(--accent-primary)' : '1px solid transparent', borderRadius: '8px', color: currentView === 'chat' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: currentView === 'chat' ? '600' : '400', textAlign: 'left' }}
            >
              <MessageSquare size={18} /> Research Chat
            </button>
            <button 
              onClick={() => setCurrentView('session')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: currentView === 'session' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: currentView === 'session' ? '1px solid var(--accent-primary)' : '1px solid transparent', borderRadius: '8px', color: currentView === 'session' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', fontWeight: currentView === 'session' ? '600' : '400', textAlign: 'left' }}
            >
              <Mic size={18} /> 1-on-1 Session
            </button>
          </div>

          <DocumentUploader onUploadSuccess={handleUploadSuccess} />

          {/* History Section */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
            <h3 className="section-title">
              <Clock size={14} /> Recent History
            </h3>
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem' }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  No recent history.
                </div>
              ) : (
                history.slice(0, 5).map(item => (
                  <div 
                    key={item.id} 
                    className="doc-item" 
                    style={{ padding: '0.5rem', gap: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => handleHistoryClick(item)}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  >
                    <div className="doc-icon" style={{ width: '24px', height: '24px' }}>
                      {item.type === 'voice' ? <Mic size={12} /> : <MessageSquare size={12} />}
                    </div>
                    <div className="doc-info">
                      <div className="doc-name" style={{ fontSize: '0.75rem' }} title={item.query}>{item.query}</div>
                      <div className="doc-meta" style={{ fontSize: '0.65rem' }}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
            <h3 className="section-title">
              <Database size={14} /> Indexed Documents
            </h3>
            
            {documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                <FileText size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem' }}>Your vector database is empty.</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-icon">
                    <FileText size={18} />
                  </div>
                  <div className="doc-info">
                    <div className="doc-name">{doc.filename}</div>
                    <div className="doc-meta">
                      {doc.is_processed ? (
                        <span style={{ color: 'var(--success-color)' }}>● FAISS Vectorized</span>
                      ) : (
                        <span style={{ color: 'var(--warning-color)' }}>○ Extracting text...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '500' }}>
            <Activity size={16} /> Advanced Analytics
          </a>
        </div>
      </div>

      <div className="panel main-area">
        <div className="top-nav">
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit size={16} /> Gemini Pro LLM
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} /> FAISS Search
            </span>
          </div>
          <div className="status-badges">
            <div className="badge">
              <div className="dot active"></div>
              Backend: Connected
            </div>
            <div className="badge" style={{ color: 'var(--accent-primary)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              Enterprise Edition
            </div>
          </div>
        </div>
        
        <div style={{ display: currentView === 'chat' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <ChatInterface 
            selectedHistory={selectedHistoryItem} 
            sessionId={sessionId} 
            setSessionId={setSessionId} 
            messages={messages} 
            setMessages={setMessages} 
          />
        </div>
        <div style={{ display: currentView === 'session' ? 'block' : 'none', height: '100%', overflow: 'hidden' }}>
          <OneToOneSession 
            selectedHistory={selectedHistoryItem} 
            sessionId={sessionId} 
            setSessionId={setSessionId} 
            setMessages={setMessages} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;
