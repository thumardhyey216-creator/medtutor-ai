import React, { useState } from 'react';

const QBankDashboard = ({ onStartTest }) => {
    const [selectedMode, setSelectedMode] = useState('quick');
    const [filters, setFilters] = useState({
        subject: '',
        difficulty: '',
        examType: 'neet-pg'
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleStart = async () => {
        setIsGenerating(true);
        // Configuration map
        const modeConfig = {
            quick: { questions: 10, timed: false },
            practice: { questions: 30, timed: true },
            'subject-test': { questions: 50, timed: true },
            'grand-mock': { questions: 200, timed: true },
        };

        const config = modeConfig[selectedMode];
        await onStartTest({
            mode: selectedMode,
            numQuestions: config.questions,
            timed: config.timed,
            filters
        });
        setIsGenerating(false);
    };

    return (
        <div id="mode-selection">
            <div className="card mb-lg">
                <div className="flex gap-md flex-wrap">
                    <select
                        className="select"
                        value={filters.subject}
                        onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                    >
                        <option value="">All Subjects</option>
                        <option value="Anatomy">Anatomy</option>
                        <option value="Physiology">Physiology</option>
                        <option value="Biochemistry">Biochemistry</option>
                        <option value="Pathology">Pathology</option>
                        <option value="Pharmacology">Pharmacology</option>
                        {/* Add more subjects */}
                    </select>
                    <select
                        className="select"
                        value={filters.difficulty}
                        onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    >
                        <option value="">All Difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select
                        className="select"
                        value={filters.examType}
                        onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
                    >
                        <option value="neet-pg">NEET PG</option>
                        <option value="ini-cet">INI CET</option>
                    </select>
                </div>
                
                {/* Custom Prompt Input */}
                <div className="mt-md">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Custom Prompt (Optional)
                    </label>
                    <textarea
                        className="input"
                        placeholder="E.g., Focus on cardiovascular drugs, or Diabetes complications..."
                        value={filters.customPrompt || ''}
                        onChange={(e) => setFilters({ ...filters, customPrompt: e.target.value })}
                        style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                    />
                </div>
            </div>

            <div className="quick-actions">
                {[
                    { id: 'quick', icon: '⚡', title: 'Quick Practice', desc: '10 questions · Untimed · Mixed topics' },
                    { id: 'practice', icon: '📖', title: 'Practice Mode', desc: '30 questions · Timed · Subject-specific' },
                    { id: 'subject-test', icon: '🎯', title: 'Subject Test', desc: '50 questions · Timed · Full subject coverage' },
                    { id: 'grand-mock', icon: '🏆', title: 'Grand Mock Test', desc: '200 questions · 3 hours · Full exam simulation' }
                ].map(mode => (
                    <div
                        key={mode.id}
                        className={`card card-interactive ${selectedMode === mode.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMode(mode.id)}
                    >
                        <div className="action-icon">{mode.icon}</div>
                        <h3 className="card-header">{mode.title}</h3>
                        <p className="text-muted" style={{ fontSize: '0.813rem', margin: '8px 0 0 0' }}>
                            {mode.desc}
                        </p>
                    </div>
                ))}
            </div>

            <div id="generate-container" className="flex justify-center mt-lg" style={{ marginTop: '32px' }}>
                <button
                    onClick={handleStart}
                    className="btn btn-primary"
                    style={{ padding: '12px 48px', fontSize: '1.1rem' }}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Generating... ⏳' : 'Generate Test ✨'}
                </button>
            </div>
        </div>
    );
};

export default QBankDashboard;
