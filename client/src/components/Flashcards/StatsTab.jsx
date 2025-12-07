import React, { useState, useEffect } from 'react';
import FlashcardAPI from '../../services/flashcardApi';

const StatsTab = () => {
    const [stats, setStats] = useState({ totalCards: 0, mastered: 0, learning: 0, streak: 0 });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await FlashcardAPI.getStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div id="stats-tab">
            <div className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Total Cards</span>
                    <span className="kpi-value">{stats.totalCards || 0}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Mastered</span>
                    <span className="kpi-value">{stats.mastered || 0}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Learning</span>
                    <span className="kpi-value">{stats.learning || 0}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Streak</span>
                    <span className="kpi-value">{stats.streak || 0} days</span>
                </div>
            </div>
            <div className="card">
                <h3 className="card-header">Review Activity (Last 7 Days)</h3>
                <div className="chart-container chart-container-sm" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    Chart Placeholder (Chart.js coming in future update)
                </div>
            </div>
        </div>
    );
};

export default StatsTab;
