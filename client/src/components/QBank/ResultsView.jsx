import React from 'react';

const ResultsView = ({ results, onReset }) => {
    // Helper to format time
    const formatTime = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="text-center mb-md">Test Complete! 🎉</h2>
            <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="kpi-card">
                    <span className="kpi-label">Score</span>
                    <span className="kpi-value">{results.score}%</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Correct</span>
                    <span className="kpi-value text-success">{results.correct}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Incorrect</span>
                    <span className="kpi-value text-error">{results.incorrect}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Time Taken</span>
                    <span className="kpi-value">{formatTime(results.timeTaken)}</span>
                </div>
            </div>
            <div className="flex gap-md justify-center">
                <button className="btn btn-outline" onClick={onReset}>Start New Test</button>
            </div>
        </div>
    );
};

export default ResultsView;
