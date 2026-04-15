// UsersRoleChart.jsx
import React from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

export default function UsersRoleChart({ users }) {

    const roleCount = {};

    users.forEach(u => {
        if (Array.isArray(u.roles)) {
            u.roles.forEach(r => {
                roleCount[r] = (roleCount[r] || 0) + 1;
            });
        }
    });

    const data = {
        labels: Object.keys(roleCount),
        datasets: [
            {
                label: "Users by Role",
                data: Object.values(roleCount),
                borderColor: "#730d19",
                backgroundColor: "rgba(115,13,25,0.52)",
                tension: 0.4,
                fill: true,
                pointRadius: 5
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top"
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return <Line data={data} options={options} />;
}