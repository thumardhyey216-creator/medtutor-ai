import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import QBankDashboard from '../components/QBank/QBankDashboard';
import TestInterface from '../components/QBank/TestInterface';
import ResultsView from '../components/QBank/ResultsView';
import useQBank from '../hooks/useQBank';

const QBank = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const {
        status,
        questions,
        currentQuestionIndex,
        currentQuestion,
        answers,
        results,
        elapsedTime,
        startTest,
        selectOption,
        checkAnswer,
        toggleFlag,
        submitTest,
        navigateQuestion,
        reset
    } = useQBank();

    return (
        <div className="app-shell">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="main">
                {/* Mobile Header Toggle */}
                <style>{`
                    @media (min-width: 769px) { .mobile-toggle { display: none !important; } }
                    @media (max-width: 768px) { .mobile-toggle { display: block !important; position: fixed; top: 12px; left: 12px; z-index: 60; } }
                `}</style>
                <button
                    className="btn-outline btn-sm mobile-toggle"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '4px 8px' }}
                >
                    ☰
                </button>

                <div className="page-header">
                    <div>
                        <h1>QBank 📝</h1>
                        <p className="page-subtitle">Practice with AI-generated and curated medical questions</p>
                    </div>
                </div>

                {/* Status-based Rendering */}
                {status === 'dashboard' && (
                    <QBankDashboard onStartTest={startTest} />
                )}

                {status === 'test' && (
                    <TestInterface
                        questions={questions}
                        currentIndex={currentQuestionIndex}
                        currentQuestion={currentQuestion}
                        answers={answers}
                        elapsedTime={elapsedTime}
                        onSelect={selectOption}
                        onCheck={checkAnswer}
                        onNavigate={navigateQuestion}
                        onFlag={toggleFlag}
                        onSubmitTest={submitTest}
                    />
                )}

                {status === 'results' && (
                    <ResultsView
                        results={results}
                        onReset={reset}
                    />
                )}

            </main>

            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 40
                    }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default QBank;
