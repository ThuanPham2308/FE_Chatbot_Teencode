import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_FLOWISE_API_URL;

const MODELS = ["FastText", "PhoBERT", "ViSoBERT"];
const MODEL_DESCRIPTIONS = {
  FastText: "Nhanh • nhẹ",
  PhoBERT: "Cân bằng",
  ViSoBERT: "Chính xác hơn",
};

async function queryFlowise(question, model) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      overrideConfig: { startState: [{ key: "model", value: model }] },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

function getTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Teencode từ dataset — lịch sự + hài + Gen Z
const SUGGESTIONS = [
  "\"ib\" và \"ibb\" khác nhau như thế nào? 📩",
  "Giải thích \"delulu\" — ảo tưởng kiểu gì? 😂",
  "\"Aura\" dùng khi khen ai đó là sao? ✨",
  "\"Gato\", \"flex\", \"slay\" — ba từ này nghĩa là gì?",
];

const HISTORY_STUB = [
  "\"bruh\" vs \"bó tay\" — khác nhau không?",
  "Giải thích các từ lóng Discord",
  "Teencode TikTok đang trending",
];

// Fun loading messages dùng teencode
const LOADING_TEXTS = [
  "Đang tra từ điển Gen Z, chill một xíu... ⏳",
  "Hệ thống đang decode, không cap đâu nhé 👀",
  "Đang xử lý, aura của câu hỏi này mạnh lắm ✨",
  "Một giây thôi, đang hỏi các besties Gen Z... 💬",
];

function getRandomLoading() {
  return LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)];
}

/* ── Icons ── */
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 6h14M5 12h10M5 18h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function ErrorMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#C0143C" strokeWidth="1.8"/>
      <path d="M12 7.5v5.5M12 16.2v.1" stroke="#C0143C" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Avatar components ── */
function BotAvatar() {
  return (
    <div className="msg-avatar bot-avatar" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="8" width="16" height="11" rx="3" fill="white" fillOpacity="0.92"/>
        <circle cx="9" cy="13.5" r="1.5" fill="#5B35E8"/>
        <circle cx="15" cy="13.5" r="1.5" fill="#5B35E8"/>
        <path d="M9.5 17c.6.7 1.5 1 2.5 1s1.9-.3 2.5-1" stroke="#5B35E8" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M9 8V6M15 8V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
        <circle cx="9" cy="5.5" r="1" fill="white" fillOpacity="0.85"/>
        <circle cx="15" cy="5.5" r="1" fill="white" fillOpacity="0.85"/>
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="msg-avatar user-avatar" aria-hidden="true">
      <span>B</span>
    </div>
  );
}

/* ── App ── */
function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText] = useState(getRandomLoading);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("PhoBERT");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text, time: getTime() }]);
    setInput('');
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const result = await queryFlowise(text, selectedModel);
      const answer = typeof result === 'string'
        ? result
        : result.text || result.answer || result.output || JSON.stringify(result);
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: answer, time: getTime() }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot', text: null,
        error: `Bruh, lỗi kết nối rồi: ${err.message} 😅`,
        time: getTime(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const startNewChat = () => { setMessages([]); setInput(''); setSidebarOpen(false); };

  return (
    <div className="app-shell">
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-dot" />
            <span>Teencode AI</span>
          </div>
          <button className="new-chat-btn" onClick={startNewChat}>
            <PlusIcon /> Cuộc trò chuyện mới
          </button>
        </div>

        <div className="sidebar-section-label">Gần đây</div>
        <div className="sidebar-history">
          {HISTORY_STUB.map((title, i) => (
            <div className={`history-item ${i === 0 ? 'active' : ''}`} key={title}>
              <HistoryIcon />{title}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="user-chip-av">B</div>
            <div className="user-chip-info">
              <span className="user-chip-name">Xin chào, besties! 👋</span>
              <span className="user-chip-sub">Đang online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-col">
        <div className="mobile-topbar">
          <button aria-label="Mở menu" onClick={() => setSidebarOpen(true)}><MenuIcon /></button>
          <h1>Teencode AI ✨</h1>
          <button aria-label="Đóng" onClick={() => setSidebarOpen(false)} style={{ visibility: sidebarOpen ? 'visible' : 'hidden' }}><CloseIcon /></button>
        </div>

        <div className="mobile-model-bar">
          {MODELS.map(m => (
            <button key={m} className={`model-btn ${selectedModel === m ? 'active' : ''}`} onClick={() => setSelectedModel(m)}>{m}</button>
          ))}
        </div>

        <div className="main-header">
          <div className="header-left">
            <div className="header-av">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="8" width="16" height="11" rx="3" fill="white" fillOpacity="0.92"/>
                <circle cx="9" cy="13.5" r="1.5" fill="#5B35E8"/>
                <circle cx="15" cy="13.5" r="1.5" fill="#5B35E8"/>
                <path d="M9 8V6M15 8V6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                <circle cx="9" cy="5.5" r="1" fill="white" fillOpacity="0.85"/>
                <circle cx="15" cy="5.5" r="1" fill="white" fillOpacity="0.85"/>
              </svg>
            </div>
            <div>
              <h1>Teencode AI ✨</h1>
              <span className="header-sub">Tra cứu ngôn ngữ Gen Z — no cap, chuẩn 100%</span>
            </div>
          </div>
          <div className="model-selector">
            {MODELS.map(m => (
              <button key={m} className={`model-btn ${selectedModel === m ? 'active' : ''}`} onClick={() => setSelectedModel(m)} title={MODEL_DESCRIPTIONS[m]}>{m}</button>
            ))}
          </div>
          <div className="status-pill"><span className="status-dot" />online</div>
        </div>

        {/* Welcome / Messages */}
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-av">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="8" width="16" height="11" rx="3" fill="white" fillOpacity="0.95"/>
                <circle cx="9" cy="13.5" r="1.6" fill="#5B35E8"/>
                <circle cx="15" cy="13.5" r="1.6" fill="#5B35E8"/>
                <path d="M9.5 17.2c.5.6 1.4.9 2.5.9s2-.3 2.5-.9" stroke="#5B35E8" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M9 8V6M15 8V6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9"/>
                <circle cx="9" cy="5.5" r="1.1" fill="white" fillOpacity="0.9"/>
                <circle cx="15" cy="5.5" r="1.1" fill="white" fillOpacity="0.9"/>
              </svg>
            </div>
            <div className="welcome-badge"><span className="dot" />Gen Z Dictionary — no cap ✨</div>
            <h3>Gặp từ lóng nào "não tàn" không hiểu?<br />Hãy hỏi hệ thống ngay! 💜</h3>
            <p>Từ <strong>aura</strong>, <strong>delulu</strong>, <strong>gato</strong> đến <strong>bruh</strong> hay <strong>slay</strong> —<br />hệ thống giải thích chill, dễ hiểu, chuẩn xác.</p>
            <div className="suggestion-grid">
              {SUGGESTIONS.map(s => (
                <button className="suggestion-card" key={s} onClick={() => sendMessage(s)}>
                  <span className="suggestion-icon">💬</span>{s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-area">
            <div className="messages-inner">
              {messages.map(msg => (
                <div className={`msg-row ${msg.role}`} key={msg.id}>
                  {msg.role === 'bot' ? <BotAvatar /> : <UserAvatar />}
                  <div className="msg-body">
                    <div className="msg-meta">
                      <span className="who">{msg.role === 'bot' ? 'Teencode AI' : 'Bạn'}</span>
                      <span className="when">{msg.time}</span>
                    </div>
                    {msg.error
                      ? <div className="error-msg"><ErrorMark />{msg.error}</div>
                      : <div className="bubble">{msg.text}</div>
                    }
                  </div>
                </div>
              ))}

              {loading && (
                <div className="msg-row bot">
                  <BotAvatar />
                  <div className="msg-body">
                    <div className="msg-meta">
                      <span className="who">Teencode AI</span>
                      <span className="when">đang soạn...</span>
                    </div>
                    <div className="bubble loading-bubble">
                      <div className="signal-wave"><span /><span /><span /></div>
                      <span className="loading-text">{loadingText}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-inner">
            <textarea
              ref={textareaRef}
              className="input-box"
              rows={1}
              placeholder="Nhập từ lóng muốn tra cứu, không cap đâu... 🔍"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
          <div className="input-hint">
            <span className="model-badge">{selectedModel}</span>
            Kết quả chỉ mang tính tham khảo — vui lòng kiểm tra lại trước khi dùng nhé 👀
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;