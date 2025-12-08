import React, { useState, useRef, useEffect } from 'react';

const ChatInput = ({
    onSendMessage,
    isLoading,
    exam,
    setExam,
    mode,
    setMode,
    generalMode,
    setGeneralMode
}) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef(null);

    const handleInput = (e) => {
        setMessage(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        onSendMessage(message);
        setMessage('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="chat-input-section">
            <div className="mode-selectors">
                <div className="mode-group">
                    <label>Exam:</label>
                    <select
                        value={exam}
                        onChange={(e) => setExam(e.target.value)}
                        className="select-compact"
                    >
                        <option value="neet-pg">🇮🇳 NEET PG</option>
                        <option value="ini-cet">INI CET</option>
                    </select>
                </div>
                <div className="mode-group">
                    <label>Response:</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="select-compact"
                    >
                        <option value="brief">⚡ Brief</option>
                        <option value="standard">📝 Standard</option>
                        <option value="comprehensive">📚 Comprehensive</option>
                        <option value="ultra">🎓 Ultra</option>
                    </select>
                </div>
                <div className="mode-group">
                    <button
                        type="button"
                        onClick={() => setGeneralMode(!generalMode)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-subtle)',
                            background: generalMode ? 'var(--accent)' : 'var(--bg-secondary)',
                            color: generalMode ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        title={generalMode ? "Switch to Exam Focus" : "Switch to General Knowledge"}
                    >
                        {generalMode ? '🌍 General Mode' : '📚 Exam Focus'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="chat-form">
                <div className="chat-input-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="textarea chat-input"
                        placeholder={generalMode ? "Ask anything (General Knowledge)..." : "Ask a medical question (Exam Focus)..."}
                        rows="1"
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                    ></textarea>
                    <button
                        type="submit"
                        className="btn btn-primary btn-send"
                        disabled={isLoading || !message.trim()}
                    >
                        {isLoading ? <span className="send-icon">⏳</span> : <span className="send-icon">➤</span>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
