import React from 'react';
import QuestionView from './QuestionView';
import QuestionPalette from './QuestionPalette';

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
    // Format Time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!currentQuestion) return <div>Loading question...</div>;

    const answer = answers[currentQuestion.id];

    return (
        <div id="test-view" className="grid-dashboard">
            <div className="question-container">
                <div className="question-header">
                    <span className="question-number">Question {currentIndex + 1} of {questions.length}</span>
                    <div className="flex gap-md items-center">
                        <span className="tag tag-accent">{currentQuestion.subject || 'Mixed'}</span>
                        <span className="question-timer">{formatTime(elapsedTime)}</span>
                    </div>
                </div>

                <QuestionView
                    question={currentQuestion}
                    answer={answer}
                    onSelect={(optIdx) => onSelect(currentQuestion.id, optIdx)}
                    onCheck={() => onCheck(currentQuestion.id)}
                />

                <div className="flex justify-between items-center mt-lg">
                    <button
                        className="btn btn-secondary"
                        onClick={() => onNavigate(currentIndex - 1)}
                        disabled={currentIndex === 0}
                    >
                        ← Previous
                    </button>
                    <div className="flex gap-sm">
                        <button className="btn btn-secondary">💬 Deep Dive</button>
                        <button className="btn btn-outline" onClick={() => onFlag(currentQuestion.id)}>
                            {answer?.isFlagged ? '🚩 Flagged' : '🚩 Flag'}
                        </button>

                        {currentIndex < questions.length - 1 ? (
                            <button
                                className="btn btn-primary"
                                onClick={() => onNavigate(currentIndex + 1)}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                style={{ backgroundColor: 'var(--success)' }}
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
        </div>
    );
};

export default TestInterface;
