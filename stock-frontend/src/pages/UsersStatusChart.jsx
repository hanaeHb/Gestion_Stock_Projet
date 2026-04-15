import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function UsersStatusChart({ users }) {

    const active = users.filter(u => u.active === true).length;
    const reactive = users.filter(u => u.active === false).length;

    const data = {
        labels: ["Active Users", "Reactive Users"],
        datasets: [
            {
                label: "Users Status",
                data: [active, reactive],
                backgroundColor: [
                    "rgba(79,172,254,0.8)",
                    "rgba(250,131,153,0.8)"
                ],
                borderRadius: 10,
                barThickness: 40
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    return <Bar data={data} options={options} />;
}