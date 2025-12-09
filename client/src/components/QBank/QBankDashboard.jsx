import React, { useState } from 'react';

const QBankDashboard = ({ onStartTest, activeSessionAvailable, onResumeSession, activeSessionData }) => {
    const [selectedMode, setSelectedMode] = useState('quick');
    const [filters, setFilters] = useState({
        subject: '',
        difficulty: '',
        examType: 'neet-pg-inicet'
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleStart = async () => {
        if (activeSessionAvailable) {
            if (!window.confirm("Starting a new test will save your current session in history but you won't be able to resume it as 'active'. Continue?")) {
                return;
            }
        }

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
            {activeSessionAvailable && (
                <div className="card mb-lg" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--bg-subtle)' }}>
                    <div className="flex justify-between items-center flex-wrap gap-md">
                        <div>
                            <h3 className="text-lg font-bold">Resume Your Session</h3>
                            <p className="text-muted">
                                You have an incomplete <strong>{activeSessionData?.mode}</strong> session with {activeSessionData?.totalQuestions} questions.
                            </p>
                        </div>
                        <div className="flex gap-sm">
                            <button 
                                onClick={onResumeSession}
                                className="btn btn-primary"
                            >
                                Resume Test ▶
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        <option value="Microbiology">Microbiology</option>
                        <option value="Forensic Medicine">Forensic Medicine</option>
                        <option value="Community Medicine">Community Medicine</option>
                        <option value="ENT">ENT</option>
                        <option value="Ophthalmology">Ophthalmology</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="General Surgery">General Surgery</option>
                        <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Psychiatry">Psychiatry</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Anesthesia">Anesthesia</option>
                        <option value="Radiology">Radiology</option>
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
                        <option value="neet-pg-inicet">NEET PG / INI CET</option>
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
