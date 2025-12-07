import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MessageItem = ({ role, content, sources, suggestedQuestions, onSuggestedClick }) => {
    const isUser = role === 'user';

    const components = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <div style={{ position: 'relative' }}>
                    <pre className={className} {...props} style={{ padding: '12px', borderRadius: '8px', overflowX: 'auto', background: 'var(--bg-secondary)' }}>
                        <code className={className} {...props}>
                            {children}
                        </code>
                    </pre>
                    <button
                        className="copy-btn"
                        style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.7em' }}
                        onClick={() => {
                            navigator.clipboard.writeText(String(children));
                        }}
                    >
                        Copy
                    </button>
                </div>
            ) : (
                <code className={className} {...props} style={{ background: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '4px', color: 'var(--warning)' }}>
                    {children}
                </code>
            );
        }
    };

    return (
        <div className={`message message-${role}`}>
            <div className="message-avatar">
                {isUser ? 'U' : 'AI'}
            </div>

            <div className={`message-content ${!isUser ? 'markdown-body' : ''}`}>
                {isUser ? (
                    // User message: simple text, preserve newlines
                    <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                ) : (
                    // AI message: Markdown
                    <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                            {content}
                        </ReactMarkdown>

                        {suggestedQuestions && suggestedQuestions.length > 0 && (
                            <div className="suggested-questions">
                                <div className="suggested-q-label">Suggested Questions:</div>
                                <div className="suggested-q-list">
                                    {suggestedQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            className="suggested-q-btn"
                                            onClick={() => onSuggestedClick(q)}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MessageItem;
