import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const ProgressChart = ({ data }) => {
    // Expect data = [{ date: '...', questions: 10, correct: 8 }]
    const labels = data?.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) || [];
    const questionsData = data?.map(d => parseInt(d.questions)) || [];
    const correctData = data?.map(d => parseInt(d.correct)) || [];

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Questions Solved',
                data: questionsData,
                backgroundColor: '#06b6d4',
                borderRadius: 4,
                barPercentage: 0.6
            },
            {
                label: 'Correct',
                data: correctData,
                backgroundColor: '#22c55e',
                borderRadius: 4,
                barPercentage: 0.6,
                hidden: true
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
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#334155' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    return <Bar data={chartData} options={options} />;
};

export default ProgressChart;
