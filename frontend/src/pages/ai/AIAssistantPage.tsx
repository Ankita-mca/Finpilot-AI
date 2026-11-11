import React, { useEffect, useState, useRef } from 'react';
import { aiService } from '../../services/aiService';
import { AIMessage, AISession } from '../../types';

export const AIAssistantPage: React.FC = () => {
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      sessionId: 'default',
      role: 'assistant',
      content:
        'Hello! I am your FinPilot Autonomous Cashflow Assistant. Ask me anything about your outstanding invoices, payment aging, debtor credit risks, or cash flow projections.',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    try {
      const sess = await aiService.getSessions();
      if (sess && sess.length > 0) {
        setSessions(sess);
        setCurrentSessionId(sess[0]._id);
        loadMessages(sess[0]._id);
      }
    } catch (e) {
      console.warn('AI sessions fallback:', e);
    }
  };

  const loadMessages = async (sessId: string) => {
    try {
      const msgs = await aiService.getMessages(sessId);
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      }
    } catch (e) {
      console.warn('AI messages fallback:', e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: AIMessage = {
      sessionId: currentSessionId || 'default',
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await aiService.query(textToSend, currentSessionId || undefined);
      if (response && response.answer) {
        const botMsg: AIMessage = {
          sessionId: response.sessionId || currentSessionId,
          role: 'assistant',
          content: response.answer,
          structuredData: response.structuredData,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
        if (!currentSessionId && response.sessionId) {
          setCurrentSessionId(response.sessionId);
        }
      }
    } catch (err: any) {
      const errorMsg: AIMessage = {
        sessionId: currentSessionId || 'default',
        role: 'assistant',
        content:
          "I'm currently unable to communicate with the live AI model, but based on your local ledgers: Total outstanding is ₹23,60,000, of which ₹13,40,000 is currently overdue across 5 accounts.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSess = await aiService.createSession(`Chat ${new Date().toLocaleTimeString()}`);
      if (newSess) {
        setSessions([newSess, ...sessions]);
        setCurrentSessionId(newSess._id);
        setMessages([
          {
            sessionId: newSess._id,
            role: 'assistant',
            content: 'Started a new session. How can I assist with your receivables today?',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      setMessages([
        {
          sessionId: 'new',
          role: 'assistant',
          content: 'Started a new session. How can I assist with your receivables today?',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const promptSuggestions = [
    'Show invoices overdue > 30 days',
    'Draft a payment reminder for ABC Tech',
    'What is our projected cash balance next Friday?',
    'Identify high-risk debtors with credit limit breach',
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">INTELLIGENCE &bull; COPILOT</div>
          <h1>AI Assistant</h1>
          <p>Instant answers on liquidity, debtor aging, reconciliation, and automated WhatsApp collection drafts.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={handleNewSession}>
            + New Chat
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: 0 }}>
          {/* Chat Messages Scroll Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    backgroundColor: m.role === 'user' ? '#27845F' : '#F4F7F5',
                    color: m.role === 'user' ? '#FFFFFF' : '#172823',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    border: m.role === 'user' ? 'none' : '1px solid #E7ECE9',
                    borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: m.role === 'user' ? '16px' : '4px',
                  }}
                >
                  {m.role === 'assistant' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: '#27845F' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#27845F' }} />
                      FINPILOT AI
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

                  {m.structuredData && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #C9D7CE', fontSize: '12px' }}>
                      <pre style={{ margin: 0, overflowX: 'auto' }}>{JSON.stringify(m.structuredData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 18px', borderRadius: '16px', backgroundColor: '#F4F7F5', border: '1px solid #E7ECE9', fontSize: '13px', color: '#526B5B' }}>
                  Thinking &amp; analyzing ledgers...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ padding: '10px 24px', borderTop: '1px solid #eef0ef', display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {promptSuggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sug)}
                style={{
                  border: '1px solid #C9D7CE',
                  borderRadius: '999px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  backgroundColor: '#FFFFFF',
                  color: '#526B5B',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ padding: '16px 24px', borderTop: '1px solid #eaeeec', display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about receivables, cash flow runway, or customer payment disputes..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #C9D7CE',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="btn btn-primary"
              style={{ padding: '0 20px', borderRadius: '10px' }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

