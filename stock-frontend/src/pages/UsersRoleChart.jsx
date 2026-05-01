
import React from "react";
import { Line } from "react-chartjs-2";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

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
                data: Object.values(roleCount),
                backgroundColor: [
                    "#667eea",
                    "#764ba2",
                    "#fbb6ce",
                    "#a18cd1",
                    "#4fd1c5"
                ],
                borderWidth: 0,
                hoverOffset: 15,
                cutout: "75%"
            }
        ]
    };

    const options = {
        plugins: {
            legend: {
                position: "bottom",
                labels: { usePointStyle: true, padding: 20, font: { weight: '600' } }
            }
        },
        maintainAspectRatio: false
    };

    return <Doughnut data={data} options={options} />;
}