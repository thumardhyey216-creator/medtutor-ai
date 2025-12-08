import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import StatsAPI from '../services/statsApi';
import ProgressChart from '../components/Stats/ProgressChart';
import AccuracyChart from '../components/Stats/AccuracyChart';

const Stats = () => {
    const [range, setRange] = useState('7d');
    const [overview, setOverview] = useState(null);
    const [activity, setActivity] = useState([]);
    const [accuracyTrend, setAccuracyTrend] = useState([]);
    const [usage, setUsage] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [range]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [overviewData, activityData, accuracyData, usageData] = await Promise.all([
                StatsAPI.getOverview(range),
                StatsAPI.getActivity(range),
                StatsAPI.getAccuracy(range),
                StatsAPI.getUsage(range)
            ]);
            setOverview(overviewData);
            setActivity(activityData.activity || []);
            setAccuracyTrend(accuracyData.trend || []);
            setUsage(usageData);
        } catch (err) {
            console.error('Failed to load stats', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !overview) {
        return (
            <div className="app-shell">
                <Sidebar isOpen={false} onClose={() => { }} />
                <main className="main flex justify-center items-center">
                    <div>Loading statistics...</div>
                </main>
            </div>
        );
    }

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
                        <h1>Performance Analytics 📊</h1>
                        <p className="page-subtitle">Track your progress and identify areas for improvement</p>
                    </div>
                    <select
                        className="select"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>

                {/* KPI Cards */}
                <div className="kpi-grid grid-4-cols">
                    <div className="kpi-card">
                        <span className="kpi-label">Study Streak</span>
                        <span className="kpi-value">{overview?.streak || 0} days</span>
                        <span className="kpi-change">{overview?.streak > 0 ? '🔥 Keep it going!' : 'Start today!'}</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">Questions Solved</span>
                        <span className="kpi-value">{overview?.questionsSolved || 0}</span>
                        <span className="kpi-change">+{overview?.questionsThisWeek || 0} this week</span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">QBank Accuracy</span>
                        <span className="kpi-value">{overview?.accuracy || 0}%</span>
                        <span className={`kpi-change ${(overview?.accuracyChange || 0) >= 0 ? '' : 'negative'}`}>
                            {(overview?.accuracyChange || 0) >= 0 ? '+' : ''}{overview?.accuracyChange || 0}% this week
                        </span>
                    </div>
                    <div className="kpi-card">
                        <span className="kpi-label">Study Time</span>
                        <span className="kpi-value">{overview?.studyHours || 0}h</span>
                        <span className="kpi-change">+{overview?.hoursThisWeek || 0}h this week</span>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid-2-cols mb-lg">
                    <div className="card">
                        <h3 className="card-header">Study Progress</h3>
                        <p className="card-subtitle">Questions and cards per day</p>
                        <div className="chart-container" style={{ position: 'relative', height: '300px' }}>
                            <ProgressChart data={activity} />
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="card-header">Accuracy Trend</h3>
                        <p className="card-subtitle">Performance over time</p>
                        <div className="chart-container" style={{ position: 'relative', height: '300px' }}>
                            <AccuracyChart data={accuracyTrend} />
                        </div>
                    </div>
                </div>

                {/* AI Usage Stats */}
                {usage && (
                    <div className="card mb-lg">
                        <h3 className="card-header">AI Usage & Tokens 🤖</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            <div className="text-center p-md bg-secondary rounded">
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {usage.summary.totalTokens.toLocaleString()}
                                </div>
                                <div className="text-muted">Total Tokens Used</div>
                            </div>
                            <div className="text-center p-md bg-secondary rounded">
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                    {usage.summary.requestCount.toLocaleString()}
                                </div>
                                <div className="text-muted">Total AI Requests</div>
                            </div>
                            <div className="p-md bg-secondary rounded" style={{ gridColumn: 'span 2' }}>
                                <h4 className="mb-sm text-sm font-bold uppercase text-muted">Usage Breakdown</h4>
                                {usage.breakdown.map(b => (
                                    <div key={b.feature} className="flex justify-between items-center mb-xs text-sm">
                                        <span style={{ textTransform: 'capitalize' }}>{b.feature.replace(/_/g, ' ')}</span>
                                        <div className="flex items-center gap-md">
                                            <span className="text-muted">{b.count} reqs</span>
                                            <span className="font-mono">{b.tokens.toLocaleString()} tok</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Row */}
                <div className="grid-dashboard">
                    {/* Subject Performance */}
                    <div className="card">
                        <h3 className="card-header">Subject Performance</h3>
                        <p className="card-subtitle">Breakdown by medical subject</p>
                        <div className="mt-md">
                            {(overview?.subjects || []).length === 0 ? (
                                <p className="text-muted">No data available yet.</p>
                            ) : (
                                overview.subjects.map((subject, idx) => (
                                    <div key={idx} style={{ marginBottom: '16px' }}>
                                        <div className="flex justify-between mb-sm">
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{subject.name}</span>
                                            <span className="text-muted" style={{ fontSize: '0.813rem' }}>
                                                {subject.questionsCount || 0} Qs · {subject.accuracy || 0}% accuracy
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${subject.accuracy || 0}%` }}></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Needs Focus */}
                    <div className="card">
                        <h3 className="card-header">Needs Focus ⚠️</h3>
                        <p className="card-subtitle">Topics requiring more attention</p>
                        <div className="needs-focus-list">
                            {(overview?.weakTopics || []).length === 0 ? (
                                <p className="text-muted" style={{ fontSize: '0.813rem' }}>Great job! No weak areas identified.</p>
                            ) : (
                                overview.weakTopics.map((topic, idx) => (
                                    <div key={idx} className="card" style={{ padding: '14px', background: 'var(--bg-secondary)' }}>
                                        <div className="flex justify-between items-center mb-sm">
                                            <span className="tag tag-accent">{topic.subject}</span>
                                            <span className="text-error" style={{ fontSize: '0.813rem', fontWeight: 600 }}>{topic.accuracy}%</span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                                            {topic.name}
                                        </div>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => window.location.href = `/qbank?topic=${topic.id}`}
                                        >
                                            Start Quiz
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Suggestions */}
                <div className="card mt-lg ai-suggestion-card">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="card-header">📅 Suggested for Today</h3>
                            <p className="text-muted mt-xs" style={{ fontSize: '0.875rem' }}>
                                {overview?.suggestions?.text || 'Based on your performance, we recommend focusing on weak areas'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-sm mt-md">
                        {(overview?.suggestions?.topics || []).map((t, i) => (
                            <span key={i} className="tag tag-accent">{t}</span>
                        ))}
                    </div>
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

export default Stats;
