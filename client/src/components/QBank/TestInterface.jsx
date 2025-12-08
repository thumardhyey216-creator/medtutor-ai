import React, { useState } from 'react';
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
    elapsedTime
}) => {
    const [deepDiveOpen, setDeepDiveOpen] = useState(false);
    const [deepDiveContent, setDeepDiveContent] = useState('');
    const [deepDiveLoading, setDeepDiveLoading] = useState(false);

    // Format Time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!currentQuestion) return <div>Loading question...</div>;

    const answer = answers[currentQuestion.id];

    const handleDeepDive = async () => {
        if (!answer?.isSubmitted) {
            alert("Please submit an answer first to get a Deep Dive explanation.");
            return;
        }

        setDeepDiveOpen(true);
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
        } catch (error) {
            console.error("Deep Dive Error:", error);
            setDeepDiveContent("Failed to generate Deep Dive explanation. Please try again.");
        } finally {
            setDeepDiveLoading(false);
        }
    };

    const handleCloseDeepDive = () => {
        setDeepDiveOpen(false);
        setDeepDiveContent(''); // Reset for next question if we want, or keep it? 
        // Better to reset if we navigate away, but here we are in a modal.
        // Actually, if we navigate, we should probably reset it. 
        // But for now, let's just close.
    };
    
    // Reset deep dive content when question changes
    React.useEffect(() => {
        setDeepDiveContent('');
        setDeepDiveOpen(false);
    }, [currentQuestion.id]);

    return (
        <div id="test-view" className="grid-dashboard">
            <div className="question-container" style={{ position: 'relative' }}>
                <div className="question-header">
                    <div className="flex items-center gap-sm">
                        <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => window.location.reload()} // Simple way to go back/reset for now, or use a prop if available
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

                <QuestionView
                    question={currentQuestion}
                    answer={answer}
                    onSelect={(optIdx) => onSelect(currentQuestion.id, optIdx)}
                    onCheck={() => onCheck(currentQuestion.id)}
                />

                {/* Navigation Bar */}
                <div className="flex justify-between items-center mt-xl pt-lg border-t border-subtle">
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
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none' }}
                            >
                                <span>✨</span> Deep Dive
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

            <QuestionPalette
                questions={questions}
                currentIndex={currentIndex}
                answers={answers}
                onNavigate={onNavigate}
            />

            {/* Deep Dive Modal */}
            {deepDiveOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'var(--bg-card)',
                        width: '90%', maxWidth: '800px', maxHeight: '90vh',
                        borderRadius: '1rem', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div className="modal-header" style={{
                            padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>✨</span> AI Deep Dive
                            </h2>
                            <button 
                                onClick={() => setDeepDiveOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem', overflowY: 'auto', lineHeight: '1.6' }}>
                            {deepDiveLoading ? (
                                <div className="flex flex-col items-center justify-center py-xl">
                                    <div className="spinner" style={{ 
                                        width: '40px', height: '40px', 
                                        border: '4px solid var(--border-subtle)', 
                                        borderTopColor: 'var(--primary)', 
                                        borderRadius: '50%', 
                                        animation: 'spin 1s linear infinite' 
                                    }}></div>
                                    <p className="mt-md text-secondary">Analyzing question context...</p>
                                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                </div>
                            ) : (
                                <div className="markdown-content">
                                    <ReactMarkdown>{deepDiveContent}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{
                            padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)',
                            textAlign: 'right'
                        }}>
                            <button className="btn btn-primary" onClick={() => setDeepDiveOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestInterface;
