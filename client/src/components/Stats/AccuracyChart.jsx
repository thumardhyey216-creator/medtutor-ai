import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AccuracyChart = ({ data }) => {
    // Expect data = [{ date: '...', accuracy: 80 }]
    const labels = data?.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) || [];
    const accuracyData = data?.map(d => parseFloat(d.accuracy)) || [];

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Accuracy (%)',
                data: accuracyData,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `Accuracy: ${context.parsed.y}%`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    return <Line data={chartData} options={options} />;
};

export default AccuracyChart;
