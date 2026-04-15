import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { FiActivity, FiArrowDownCircle, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import './PurchaseBudgetTracker.css';

interface BudgetData {
    montantInitial: number;
    montantConsomme: number;
    montantRestant: number;
    description: string;
}

const PurchaseBudgetTracker: React.FC = () => {
    const [budget, setBudget] = useState<BudgetData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBudget = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get("http://localhost:8888/budgetstock/v1/budgets/current", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBudget(res.data);
            } catch (err) {
                console.error("No active budget found");
            } finally {
                setLoading(false);
            }
        };
        fetchBudget();
    }, []);

    if (loading) return <div className="loader">Chargement du budget...</div>;
    if (!budget) return <div className="no-budget">Aucun budget actif pour le moment.</div>;

    const data = [
        { name: 'Consommé', value: budget.montantConsomme },
        { name: 'Restant', value: budget.montantRestant }
    ];

    const COLORS = ['#af3644', '#3f5277'];

    return (
        <div className="purchase-tracker-container animate-fade-in">
            <header className="purchase-header">
                <div className="header-text">
                    <h1><FiActivity /> Budget Status</h1>
                    <p>{budget.description}</p>
                </div>
                <div className="budget-badge">Active</div>
            </header>

            <div className="purchase-grid">
                <div className="tracker-card chart-section">
                    <h3 className="card-title">Use of funds</h3>
                    <div className="gauge-wrapper">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="100%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill={COLORS[0]} />
                                    <Cell fill={COLORS[1]} />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="gauge-info">
                            <span className="percentage">
                                {((budget.montantConsomme / budget.montantInitial) * 100).toFixed(1)}%
                            </span>
                            <span className="percentage-label">Consumes</span>
                        </div>
                    </div>
                </div>

                <div className="stats-column">
                    <div className="mini-stat-card pink">
                        <div className="stat-icon"><FiArrowDownCircle /></div>
                        <div className="stat-data">
                            <span>Amount Spent</span>
                            <strong>{budget.montantConsomme.toLocaleString()} DH</strong>
                        </div>
                    </div>

                    <div className="mini-stat-card purple">
                        <div className="stat-icon"><FiCreditCard /></div>
                        <div className="stat-data">
                            <span>Remaining Amount</span>
                            <strong>{budget.montantRestant.toLocaleString()} DH</strong>
                        </div>
                    </div>

                    {budget.montantRestant < (budget.montantInitial * 0.1) && (
                        <div className="alert-card-minimal">
                            <FiAlertCircle />
                            <span>Warning: Budget almost exhausted!</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchaseBudgetTracker;