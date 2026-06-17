import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, Cpu, Terminal, Search, Layers, User, Bot, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';
import { sendChatMessage } from '../services/api';
import { saveToHistory } from '../services/history';

export default function ChatInterface({ selectedHistory, sessionId, setSessionId, messages, setMessages }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (selectedHistory && selectedHistory.type === 'chat') {
      // Don't overwrite the whole shared session just because they clicked a history item,
      // actually if they click history it should probably just append it or set it.
      // The user wants to see the context. If we overwrite, we lose current chat.
      // Let's just append it to view.
      const exists = messages.find(m => m.content === selectedHistory.query);
      if (!exists) {
        setMessages(prev => [...prev, 
          { role: 'user', content: selectedHistory.query },
          { role: 'assistant', content: selectedHistory.response, citations: [] }
        ]);
      }
    }
  }, [selectedHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleSend = async (e, directText = null) => {
    e?.preventDefault();
    const messageText = directText || input;
    if (!messageText.trim() || loading) return;

    const userMsg = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    if (!directText) setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(sessionId, userMsg.content);
      if (!sessionId) setSessionId(response.session_id);
      
      saveToHistory('chat', userMsg.content, response.content);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content,
        citations: response.citations,
        confidence: response.confidence_score,
        thought_process: response.thought_process,
        suggested_questions: response.suggested_questions
      }]);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Connection failed. Ensure the FastAPI backend is running.';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, confidence: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-container">
        {messages.length === 0 && (
          <div className="welcome-screen">
            <h2 className="welcome-title">Research Intelligence</h2>
            <p className="welcome-subtitle">
              Enterprise-grade Retrieval-Augmented Generation (RAG) powered by Gemini Pro.<br/>
              Ground your queries in facts extracted via semantic FAISS vector search.
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <h4><Search size={16} color="var(--accent-primary)" /> Semantic Search</h4>
                <p>Advanced dense vector embeddings map natural language queries directly to document content.</p>
              </div>
              <div className="feature-card">
                <h4><Layers size={16} color="var(--accent-purple)" /> Auto-Chunking</h4>
                <p>Intelligent text splitting with overlap ensures context retention across large PDFs.</p>
              </div>
              <div className="feature-card">
                <h4><Terminal size={16} color="var(--success-color)" /> Source Citations</h4>
                <p>Every claim is traced back to the exact page and paragraph of the uploaded source.</p>
              </div>
              <div className="feature-card">
                <h4><Cpu size={16} color="var(--warning-color)" /> Hallucination Guard</h4>
                <p>Strict LLM prompting constraints minimize out-of-context fabrication.</p>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.role}`}>
            <div className={`avatar ${msg.role}`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={22} />}
            </div>
            
            <div className="message-content" style={{ flex: 1 }}>
              {msg.role === 'assistant' && msg.thought_process && msg.thought_process.length > 0 && (
                <div style={{ marginBottom: '1rem', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Cpu size={14} /> Agentic Reasoning Trace
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {msg.thought_process.map((step, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        {step.status === 'done' ? (
                          <span style={{ color: 'var(--success-color)' }}>✓</span>
                        ) : step.status === 'error' ? (
                          <span style={{ color: 'var(--danger-color)' }}>✗</span>
                        ) : (
                          <span style={{ color: 'var(--warning-color)' }}>○</span>
                        )}
                        <div>
                          <strong style={{ color: '#fff' }}>{step.step}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{step.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="markdown-body" style={{ fontSize: '0.95rem', lineHeight: '1.6', overflowWrap: 'break-word' }}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      if (!inline && match && match[1] === 'mermaid') {
                        return <Mermaid chart={String(children).replace(/\n$/, '')} />
                      }
                      return <code className={className} {...props}>{children}</code>
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>

              {msg.role === 'assistant' && msg.suggested_questions && msg.suggested_questions.length > 0 && (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: '600' }}>Suggested Follow-up Questions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {msg.suggested_questions.map((q, qIdx) => (
                      <button 
                        key={qIdx} 
                        onClick={(e) => handleSend(e, q)}
                        style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {msg.role === 'assistant' && msg.confidence !== undefined && msg.confidence < 0.5 && (
                <div style={{ color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                  <AlertTriangle size={14} /> Warning: System detected low retrieval confidence for this answer.
                </div>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <div className="citation-block">
                  <div className="citation-source">
                    <Layers size={14} />
                    Grounding Sources
                  </div>
                  <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {msg.citations.map((cit, cIdx) => (
                      <li key={cIdx} style={{ marginBottom: '0.5rem', borderLeft: '1px solid #333', paddingLeft: '0.75rem' }}>
                        <span style={{ color: '#fff', fontWeight: '500' }}>{cit.source}</span> {cit.page ? `(Page ${cit.page})` : ''}
                        <div style={{ marginTop: '0.25rem', fontStyle: 'italic', opacity: 0.8 }}>"{cit.text_snippet}"</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`message-wrapper assistant`}>
            <div className="avatar assistant">
              <Bot size={22} />
            </div>
            <div className="message-content">
              <div className="typing-indicator" style={{ padding: '0.25rem 0' }}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      <div className="input-container">
        <form onSubmit={handleSend} className="input-box">
          <textarea 
            ref={textareaRef}
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Query your knowledge base... (Shift+Enter for new line)"
            rows={1}
            style={{
              minHeight: '24px',
              height: textareaRef.current ? `${Math.min(textareaRef.current.scrollHeight, 150)}px` : 'auto'
            }}
          />
          <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
          <button type="button" className="send-btn" onClick={() => { setMessages([]); setSessionId(''); }} title="Clear Chat" style={{ marginLeft: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger-color)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <Trash2 size={18} />
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: '#666', fontFamily: 'var(--font-mono)' }}>
          ResearchGPT Pro uses advanced RAG vector search. LLMs may still produce inaccurate results.
        </div>
      </div>
    </div>
  );
}
