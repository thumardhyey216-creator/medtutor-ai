import React, { useState, useEffect, useRef } from 'react';
import QuestionView from './QuestionView';
import QuestionPalette from './QuestionPalette';
import QBankAPI from '../../services/qbankApi';
import ReactMarkdown from 'react-markdown';

const TestInterface = ({
    questions,
    currentIndex,
    currentQuestion,
    answers,
    onSelect,
    onCheck,
    onNavigate,
    onFlag,
    onSubmitTest,
    onExit,
    elapsedTime
}) => {
    const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
    const [deepDiveContent, setDeepDiveContent] = useState('');
    const [deepDiveLoading, setDeepDiveLoading] = useState(false);
    
    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    const answer = answers[currentQuestion.id];

    // Format time helper
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDeepDive = async () => {
        if (!answer?.isSubmitted) {
            alert("Please submit an answer first to get a Deep Dive explanation.");
            return;
        }

        setIsDeepDiveOpen(true);
        if (deepDiveContent) return; // Already loaded

        setDeepDiveLoading(true);
        try {
            const res = await QBankAPI.getDeepDive({
                questionId: currentQuestion.id,
                selectedOption: answer.selected,
                correctOption: answer.correctOption,
                stem: currentQuestion.stem,
                subject: currentQuestion.subject
            });
            setDeepDiveContent(res.content);
            // Add deep dive as the first message in chat history implicitly or explicitly?
            // Let's keep it separate for now as the "context".
        } catch (error) {
            console.error("Deep Dive Error:", error);
            setDeepDiveContent("Failed to generate Deep Dive explanation. Please try again.");
        } finally {
            setDeepDiveLoading(false);
        }
    };

    const handleSendChat = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMsg = { role: 'user', content: chatInput };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            // Include deep dive content in history/context if available
            const context = {
                questionId: currentQuestion.id,
                stem: currentQuestion.stem,
                subject: currentQuestion.subject,
                explanation: answer?.explanation
            };

            // If this is the first chat, we might want to include the deep dive content as prior context
            // handled by backend or we prepend it here.
            // For now, just send history.
            
            const res = await QBankAPI.sendChat(userMsg.content, chatHistory, context);
            
            setChatHistory(prev => [...prev, { role: 'model', content: res.content }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I couldn't process that request." }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, deepDiveContent, isDeepDiveOpen]);

    // Reset deep dive content when question changes
    useEffect(() => {
        setDeepDiveContent('');
        setChatHistory([]);
        setIsDeepDiveOpen(false);
    }, [currentQuestion.id]);

    return (
        <div id="test-view" className="grid-dashboard" style={{ 
            display: 'flex', 
            height: 'calc(100vh - 140px)', // Adjust based on header/footer
            gap: '1.5rem',
            overflow: 'hidden' 
        }}>
            {/* Main Question Area */}
            <div className="question-container-wrapper" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                overflowY: 'auto',
                paddingRight: '0.5rem'
            }}>
                <div className="question-container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="question-header">
                        <div className="flex items-center gap-sm">
                            <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => window.location.reload()} 
                                style={{ marginRight: '1rem', border: 'none', padding: 0, fontSize: '1.2rem' }}
                                title="Exit Quiz"
                            >
                                ←
                            </button>
                            <span className="question-number">Question {currentIndex + 1} of {questions.length}</span>
                        </div>
                        <div className="flex gap-md items-center">
                            <span className="tag tag-accent">{currentQuestion.subject || 'Mixed'}</span>
                            <span className="question-timer">⏱ {formatTime(elapsedTime)}</span>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <QuestionView
                            question={currentQuestion}
                            answer={answer}
                            onSelect={(optIdx) => onSelect(currentQuestion.id, optIdx)}
                            onCheck={() => onCheck(currentQuestion.id)}
                        />
                    </div>

                    {/* Navigation Bar */}
                    <div className="flex justify-between items-center mt-xl pt-lg border-t border-subtle" style={{ marginTop: 'auto' }}>
                        <button
                            className="btn btn-secondary flex items-center gap-xs"
                            onClick={() => onNavigate(currentIndex - 1)}
                            disabled={currentIndex === 0}
                        >
                            <span>←</span> Previous
                        </button>
                        
                        <div className="flex gap-sm">
                            {answer?.isSubmitted && (
                                <button 
                                    className="btn btn-secondary flex items-center gap-xs"
                                    onClick={handleDeepDive}
                                    style={{ 
                                        background: isDeepDiveOpen ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                                        color: isDeepDiveOpen ? 'var(--text-primary)' : 'white', 
                                        border: isDeepDiveOpen ? '1px solid var(--border-subtle)' : 'none' 
                                    }}
                                >
                                    <span>✨</span> {isDeepDiveOpen ? 'Close Deep Dive' : 'Deep Dive'}
                                </button>
                            )}
                            
                            <button 
                                className={`btn ${answer?.isFlagged ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => onFlag(currentQuestion.id)}
                            >
                                {answer?.isFlagged ? '🚩 Flagged' : '🏳 Flag'}
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button
                                    className="btn btn-primary flex items-center gap-xs"
                                    onClick={() => onNavigate(currentIndex + 1)}
                                >
                                    Next <span>→</span>
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                                    onClick={onSubmitTest}
                                >
                                    Submit Test
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Question Palette (Mobile/Tablet usually, but here we keep it or hide it?) 
                    The original code had it below. Let's keep it below or maybe it should be a sidebar too?
                    The original grid-dashboard likely handled it. 
                    For now, I'll put it in a details/summary or just below.
                */}
                <div className="mt-lg">
                     <QuestionPalette
                        questions={questions}
                        currentIndex={currentIndex}
                        answers={answers}
                        onNavigate={onNavigate}
                    />
                </div>
            </div>

            {/* Deep Dive Sidebar */}
            {isDeepDiveOpen && (
                <div className="deep-dive-sidebar" style={{ 
                    width: '400px', 
                    minWidth: '350px',
                    backgroundColor: 'var(--bg-card)',
                    borderLeft: '1px solid var(--border-subtle)',
                    borderRadius: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '-4px 0 15px rgba(0,0,0,0.05)'
                }}>
                    <div className="sidebar-header" style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>✨</span> Deep Dive
                        </h3>
                        <button onClick={() => setIsDeepDiveOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                    </div>

                    <div className="sidebar-content" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                        {deepDiveLoading ? (
                             <div className="flex flex-col items-center justify-center py-xl">
                                <div className="spinner" style={{ 
                                    width: '30px', height: '30px', 
                                    border: '3px solid var(--border-subtle)', 
                                    borderTopColor: 'var(--primary)', 
                                    borderRadius: '50%', 
                                    animation: 'spin 1s linear infinite' 
                                }}></div>
                                <p className="mt-sm text-secondary text-sm">Analyzing...</p>
                                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : (
                            <>
                                <div className="deep-dive-text markdown-content" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    <ReactMarkdown>{deepDiveContent}</ReactMarkdown>
                                </div>

                                <div className="chat-divider" style={{ 
                                    borderTop: '1px solid var(--border-subtle)', 
                                    margin: '1rem 0', 
                                    paddingTop: '0.5rem',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    textAlign: 'center'
                                }}>
                                    Chat with AI Tutor
                                </div>

                                <div className="chat-messages" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {chatHistory.map((msg, idx) => (
                                        <div key={idx} className={`chat-msg ${msg.role}`} style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '90%',
                                            backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-secondary)',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                            padding: '0.75rem',
                                            borderRadius: '0.75rem',
                                            borderBottomRightRadius: msg.role === 'user' ? '0' : '0.75rem',
                                            borderBottomLeftRadius: msg.role === 'model' ? '0' : '0.75rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="chat-msg model" style={{ alignSelf: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            Typing...
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <div className="flex gap-xs">
                            <input 
                                type="text" 
                                className="input" 
                                placeholder="Ask follow-up questions..." 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                                style={{ flex: 1 }}
                            />
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSendChat}
                                disabled={chatLoading || !chatInput.trim()}
                            >
                                ↑
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestInterface;