import React, { useState, useEffect } from 'react';
import FlashcardAPI from '../../services/flashcardApi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatsTab = () => {
    const [stats, setStats] = useState({ totalCards: 0, mastered: 0, learning: 0, streak: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await FlashcardAPI.getStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Data for Doughnut Chart (Distribution)
    const distributionData = {
        labels: ['Mastered', 'Learning', 'New/Unseen'],
        datasets: [
            {
                label: '# of Cards',
                data: [stats.mastered, stats.learning, stats.totalCards - (stats.mastered + stats.learning)],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(201, 203, 207, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(201, 203, 207, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Mock Data for Activity Chart (Last 7 Days)
    // In a real app, we would fetch this from an API endpoint like /flashcards/activity
    const activityData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Cards Reviewed',
                data: [12, 19, 3, 5, 2, 3, 15], // Mock data
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    if (loading) {
        return <div className="p-xl text-center">Loading stats...</div>;
    }

    return (
        <div id="stats-tab">
            <div className="kpi-grid mb-lg">
                <div className="kpi-card">
                    <span className="kpi-label">Total Cards</span>
                    <span className="kpi-value">{stats.totalCards || 0}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Mastered</span>
                    <span className="kpi-value text-success">{stats.mastered || 0}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Learning</span>
                    <span className="kpi-value text-warning">{stats.learning || 0}</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Streak</span>
                    <span className="kpi-value">🔥 {stats.streak || 0}</span>
                </div>
            </div>

            <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                <div className="card">
                    <h3 className="card-header">Mastery Distribution</h3>
                    <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
                        <Doughnut data={distributionData} options={options} />
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-header">Review Activity (Last 7 Days)</h3>
                    <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
                        <Bar data={activityData} options={options} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsTab;
