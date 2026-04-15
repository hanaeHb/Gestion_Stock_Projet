import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FiDollarSign, FiCalendar, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';
import './BudgetManagement.css';

interface BudgetRequest {
    description: string;
    montantInitial: number;
    dateDebut: string;
    dateFin: string;
}

interface ChartData {
    name: string;
    value: number;
}

const BudgetManagement: React.FC = () => {
    const [amount, setAmount] = useState<number>(50000);
    const [description, setDescription] = useState<string>("");
    const [dates, setDates] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [loading, setLoading] = useState<boolean>(false);

    const MAX_LIMIT: number = 200000;
    const COLORS: string[] = ['#af3644', ' #e2e8f0'];

    const chartData: ChartData[] = [
        { name: 'Foreseen', value: amount },
        { name: 'Remains of the Ceiling', value: Math.max(0, MAX_LIMIT - amount) }
    ];

    const handleSave = async (): Promise<void> => {
        if (!description || !dates.start || !dates.end) {
            alert("Please fill in all fields !");
            return;
        }

        setLoading(true);
        const payload: BudgetRequest = {
            description,
            montantInitial: amount,
            dateDebut: dates.start,
            dateFin: dates.end
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post("http://localhost:8888/budgetstock/v1/budgets", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("✅ Budget created successfully !");
        } catch (err: any) {
            console.error(err);
            alert("❌ Error: " + (err.response?.data?.message || "Error of Server"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="budget-container animate-fade-in">
            <header className="header">
                <h1><FiTrendingUp style={{marginRight: '10px'}}/> Financial Planning</h1>
                <p>Define the budget limits for the upcoming period</p>
            </header>

            <div className="budget-grid">
                {/* Visual Section */}
                <div className="budget-card visual-section">
                    <h3 className="card-title">Visual Overview</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill={COLORS[0]} />
                                    <Cell fill={COLORS[1]} />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="chart-center-info">
                            <span className="amount-text">{amount.toLocaleString()} <small>DH</small></span>
                            <span className="status-label">Estimated Budget</span>
                        </div>
                    </div>

                    <div className="slider-container">
                        <input
                            type="range" min="5000" max={MAX_LIMIT} step="1000"
                            value={amount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))}
                            className="modern-slider"
                        />
                        <div className="range-labels">
                            <span>5k DH</span>
                            <span>200k DH</span>
                        </div>
                    </div>
                </div>

                {/* Configuration Section */}
                <div className="budget-card form-section">
                    <h3 className="card-title">Configuration</h3>

                    <div className="input-group">
                        <label><FiDollarSign /> Budget Description</label>
                        <input
                            type="text"
                            placeholder="Ex: April Maintenance Budget"
                            className="modern-input"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="dates-grid">
                        <div className="input-group">
                            <label><FiCalendar /> Start Date</label>
                            <input
                                type="date"
                                className="modern-input"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDates({...dates, start: e.target.value})}
                            />
                        </div>
                        <div className="input-group">
                            <label><FiCalendar /> End Date</label>
                            <input
                                type="date"
                                className="modern-input"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDates({...dates, end: e.target.value})}
                            />
                        </div>
                    </div>

                    <button
                        className={`confirm ${loading ? 'loading' : ''}`}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? "Enregistrement..." : <><FiCheckCircle /> Confirm Plan</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BudgetManagement;