import React from "react";
import { Bar } from "react-chartjs-2";
import { PolarArea } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

export default function UsersStatusChart({ users }) {

    const active = users.filter(u => u.active === true).length;
    const reactive = users.filter(u => u.active === false).length;

    const data = {
        labels: ["Active", "Reactive"],
        datasets: [
            {
                data: [active, reactive],
                backgroundColor: [
                    "rgba(102, 126, 234, 0.7)",
                    "rgba(251, 182, 206, 0.7)"
                ],
                borderColor: ["#667eea", "#fbb6ce"],
                borderWidth: 2
            }
        ]
    };

    const options = {
        scales: {
            r: { grid: { display: false }, ticks: { display: false } }
        },
        plugins: {
            legend: { position: "bottom" }
        },
        maintainAspectRatio: false
    };

    return <PolarArea data={data} options={options} />;
}