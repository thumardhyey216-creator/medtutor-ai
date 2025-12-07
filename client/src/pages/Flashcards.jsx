import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import PracticeTab from '../components/Flashcards/PracticeTab';
import DecksTab from '../components/Flashcards/DecksTab';
import LibraryTab from '../components/Flashcards/LibraryTab';
import CreateTab from '../components/Flashcards/CreateTab';
import StatsTab from '../components/Flashcards/StatsTab';

const Flashcards = () => {
    const [activeTab, setActiveTab] = useState('practice');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Navigation Helper
    const switchTab = (tab) => setActiveTab(tab);

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
                        <h1>Flashcards 📇</h1>
                        <p className="page-subtitle">Master medical concepts with spaced repetition</p>
                    </div>
                </div>

                <div className="tabs">
                    {['practice', 'decks', 'library', 'create', 'stats'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => switchTab(tab)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="tab-content active">
                    {activeTab === 'practice' && <PracticeTab />}
                    {activeTab === 'decks' && <DecksTab onStartReview={() => switchTab('practice')} onManageDeck={() => { }} />}
                    {activeTab === 'library' && <LibraryTab />}
                    {activeTab === 'create' && <CreateTab />}
                    {activeTab === 'stats' && <StatsTab />}
                </div>
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

export default Flashcards;
