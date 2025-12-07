import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

const MessageList = ({
    messages,
    isLoading,
    onSuggestedClick,
    hasMore,
    loadMoreMessages,
    isHistoryLoading
}) => {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    // Auto-scroll to bottom on new messages (if logic permits, e.g. user is at bottom)
    useEffect(() => {
        if (!isHistoryLoading && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isHistoryLoading]);

    return (
        <div className="chat-messages-area">
            <div className="chat-messages" ref={containerRef}>
                {hasMore && (
                    <div className="load-previous-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <button
                            className="btn-secondary btn-sm"
                            onClick={loadMoreMessages}
                            disabled={isHistoryLoading}
                        >
                            {isHistoryLoading ? 'Loading...' : 'Load Previous Messages'}
                        </button>
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="welcome-prompt">
                        <div className="welcome-icon">🩺</div>
                        <h2>Welcome to MedTutor AI</h2>
                        <p>Your AI-powered medical exam preparation assistant</p>

                        <div className="quick-prompts">
                            <button className="quick-prompt-btn" onClick={() => onSuggestedClick("Explain the pathophysiology of heart failure")}>
                                🫀 Heart Failure Pathophysiology
                            </button>
                            <button className="quick-prompt-btn" onClick={() => onSuggestedClick("Create a mnemonic for cranial nerves")}>
                                🧠 Cranial Nerves Mnemonic
                            </button>
                            <button className="quick-prompt-btn" onClick={() => onSuggestedClick("Clinical case: A 45-year-old with chest pain")}>
                                🩺 Clinical Case
                            </button>
                            <button className="quick-prompt-btn" onClick={() => onSuggestedClick("High yield points for diabetes mellitus")}>
                                📚 Diabetes High Yield
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <MessageItem
                            key={idx}
                            role={msg.role}
                            content={msg.content}
                            sources={msg.sources}
                            suggestedQuestions={msg.suggestedQuestions}
                            onSuggestedClick={onSuggestedClick}
                        />
                    ))
                )}

                {isLoading && (
                    <div className="message message-ai typing-indicator">
                        <div className="message-avatar">AI</div>
                        <div className="message-content">
                            <div className="typing-dots"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default MessageList;
