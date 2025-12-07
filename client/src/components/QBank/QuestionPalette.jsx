import React from 'react';

const QuestionPalette = ({ questions, currentIndex, answers, onNavigate }) => {
    const getItemClass = (index, questionId) => {
        let cls = 'palette-item ';
        if (index === currentIndex) cls += 'current ';

        const ans = answers[questionId];
        if (ans) {
            if (ans.isSubmitted) cls += 'answered ';
            if (ans.isFlagged) cls += 'flagged ';
        }
        return cls;
    };

    return (
        <div className="card navigator-sidebar">
            <div className="flex justify-between items-center mb-md">
                <h3 className="card-header" style={{ fontSize: '1rem', margin: 0 }}>Navigator</h3>
            </div>

            <div id="question-palette" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {questions.map((q, i) => (
                    <div
                        key={q.id}
                        className={getItemClass(i, q.id)}
                        onClick={() => onNavigate(i)}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-sm mb-xs"><div style={{ width: '12px', height: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', borderRadius: '4px' }}></div> Unseen</div>
                <div className="flex items-center gap-sm mb-xs"><div style={{ width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '4px' }}></div> Current</div>
                <div className="flex items-center gap-sm mb-xs"><div style={{ width: '12px', height: '12px', background: 'var(--success-soft)', border: '1px solid var(--success)', borderRadius: '4px' }}></div> Answered</div>
                <div className="flex items-center gap-sm mb-xs"><div style={{ width: '12px', height: '12px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: '4px' }}></div> Flagged</div>
            </div>
        </div>
    );
};

export default QuestionPalette;
