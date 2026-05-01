import React, {useEffect, useState} from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FiDollarSign, FiCalendar, FiCheckCircle, FiTrendingUp, } from 'react-icons/fi';
import { FaTrash, FaEdit } from 'react-icons/fa';
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
        const token = localStorage.getItem('token');

        const payload: BudgetRequest = {
            description,
            montantInitial: amount,
            dateDebut: dates.start,
            dateFin: dates.end
        };

        try {
            if (isEditing && editingId) {
                await axios.put(`http://localhost:8888/budgetstock/v1/budgets/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("✅ Budget updated successfully!");
            } else {
                await axios.post("http://localhost:8888/budgetstock/v1/budgets", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("✅ Budget created successfully!");
            }

            resetForm();
            fetchBudgets();
        } catch (err: any) {
            alert("❌ Error saving budget");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditingId(null);
        setDescription("");
        setAmount(50000);
        setDates({ start: '', end: '' });
    };
    const [budgetsList, setBudgetsList] = useState<any[]>([]);
    const fetchBudgets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get("http://localhost:8888/budgetstock/v1/budgets", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBudgetsList(res.data);
        } catch (err) {
            console.error("Error fetching budgets", err);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, []);
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PLANNED':
                return { label: 'Planned', color: '#818cf8', bg: '#f5f3ff' };
            case 'ACTIVE':
                return { label: 'Active', color: '#10b981', bg: '#ecfdf5' };
            case 'EXHAUSTED':
                return { label: 'Exhausted', color: '#ef4444', bg: '#fef2f2' };
            case 'CLOSED':
                return { label: 'Closed', color: '#64748b', bg: '#f1f5f9' };
            default:
                return { label: status, color: '#94a3b8', bg: '#f8fafc' };
        }
    };
    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this budget? This action cannot be undone.")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8888/budgetstock/v1/budgets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("✅ Budget deleted successfully!");
            fetchBudgets();
        } catch (err: any) {
            console.error(err);
            alert("❌ Error: " + (err.response?.data?.message || "Could not delete budget"));
        }
    };
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleEdit = (budget: any) => {
        setIsEditing(true);

        setEditingId(budget.idBudget);
        setAmount(budget.montantInitial);
        setDescription(budget.description);
        setDates({
            start: budget.dateDebut,
            end: budget.dateFin
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                                    <Cell fill={COLORS[0]}/>
                                    <Cell fill={COLORS[1]}/>
                                </Pie>
                                <Tooltip/>
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
                        <label><FiDollarSign/> Budget Description</label>
                        <input
                            type="text"
                            placeholder="Ex: April Maintenance Budget"
                            className="modern-input"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="dates-grid">
                        <div className="input-group">
                            <label><FiCalendar/> Start Date</label>
                            <input
                                type="date"
                                className="modern-input"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDates({
                                    ...dates,
                                    start: e.target.value
                                })}
                            />
                        </div>
                        <div className="input-group">
                            <label><FiCalendar/> End Date</label>
                            <input
                                type="date"
                                className="modern-input"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDates({
                                    ...dates,
                                    end: e.target.value
                                })}
                            />
                        </div>
                    </div>

                    <button className="confirm" onClick={handleSave} disabled={loading}>
                        {loading ? "Processing..." : (isEditing ? "Update Budget" : "Confirm Plan")}
                    </button>
                </div>
            </div>
            <div className="budget-history-section animate-fade-up" style={{marginTop: '40px'}}>
                <div className="table-header-box">
                    <h3>📂 Budget History</h3>
                    <p>Overview of all planned financial periods</p>
                </div>

                <div className="modern-table-wrapper">
                    <table className="budget-table">
                        <thead>
                        <tr>
                            <th>Description</th>
                            <th>Amount (DH)</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {budgetsList.map((b, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="desc-cell">
                                        <div className="desc-icon">B</div>
                                        <span>{b.description}</span>
                                    </div>
                                </td>
                                <td className="amount-cell">{b.montantInitial?.toLocaleString()} DH</td>
                                <td>{b.dateDebut}</td>
                                <td>{b.dateFin}</td>
                                <td>
                                    {(() => {
                                        const style = getStatusStyles(b.status);
                                        return (
                                            <span style={{
                                                background: style.bg,
                                                color: style.color,
                                                padding: '6px 14px',
                                                borderRadius: '100px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                border: `1px solid ${style.color}20`,
                                                display: 'inline-block',
                                                minWidth: '85px',
                                                textAlign: 'center'
                                            }}>
                                                {style.label}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="actions-cell">
                                    <div className="action-btns-wrapper">
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => handleEdit(b)}
                                            title="Edit Budget"
                                        >
                                            <FaEdit/>
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(b.idBudget)}
                                            title="Delete Budget"
                                        >
                                            <FaTrash/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BudgetManagement;