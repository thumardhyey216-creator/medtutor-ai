import React from 'react';
import ReactMarkdown from 'react-markdown';

const QuestionView = ({ question, answer, onSelect, onCheck }) => {
    // Determine visual state of options
    const getOptionClass = (index) => {
        let baseClass = 'option-item ';
        if (answer?.selected === undefined) return baseClass;

        if (answer.selected === index) baseClass += 'selected ';

        if (answer.isSubmitted) {
            if (index === answer.correctOption) baseClass += 'correct ';
            else if (index === answer.selected && !answer.isCorrect) baseClass += 'incorrect ';
        }

        return baseClass;
    };

    const handleOptionClick = (index) => {
        if (answer?.isSubmitted) return; // Prevent changing after submission
        onSelect(index);
    };

    return (
        <div className="question-container">
            <div className="question-stem" id="question-stem">
                {question.stem}
            </div>

            <div className="question-options">
                {(question.options || []).map((opt, i) => (
                    <div
                        key={i}
                        className={getOptionClass(i)}
                        onClick={() => handleOptionClick(i)}
                    >
                        <span className="option-label">{['A', 'B', 'C', 'D'][i]}</span>
                        <span className="option-text">{opt}</span>
                    </div>
                ))}
            </div>

            {answer?.isSubmitted && (
                <div id="explanation-panel" className="explanation-panel">
                    <div className="explanation-title" style={{ color: answer.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                        {answer.isCorrect ? '✓ Correct Answer' : `Incorrect. Correct: ${['A', 'B', 'C', 'D'][answer.correctOption]}`}
                    </div>
                    <div className="explanation-content">
                        <ReactMarkdown>{answer.explanation || 'No explanation available.'}</ReactMarkdown>
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-lg">
                {!answer?.isSubmitted && (
                    <button
                        className="btn btn-primary"
                        onClick={onCheck}
                        disabled={answer?.selected === undefined}
                    >
                        Check Answer
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuestionView;
