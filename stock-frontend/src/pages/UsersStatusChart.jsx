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
                    "rgba(115, 13, 25, 0.7)",
                    "rgba(255, 154, 158, 0.7)"
                ],
                borderColor: [
                    "#730d19",
                    "#ff9a9e"
                ],
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