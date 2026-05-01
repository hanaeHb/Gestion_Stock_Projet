import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Area, AreaChart
} from 'recharts';

interface Category {
    id: string | number;
    nom: string;
}

interface Product {
    id: string | number;
    nom: string;
    quantiteDisponible: number;
    seuilCritique?: number;
    category?: Category;
    id_categorie?: string | number;
}

interface AnalyticsProps {
    products: Product[];
    categories: Category[];
}
interface BudgetData {
    id?: number;
    montantInitial: number;
    dateDebut: string;
    description: string;
}

interface AnalyticsProps {
    products: Product[];
    categories: Category[];
    budgets?: BudgetData[];
}
const AnalyticsDashboard: React.FC<AnalyticsProps> = ({ products, categories, budgets = []}) => {

    const monthlyBudgetData = [
        { month: 'Jan', amount: 0 }, { month: 'Feb', amount: 0 }, { month: 'Mar', amount: 0 },
        { month: 'Apr', amount: 0 }, { month: 'May', amount: 0 }, { month: 'Jun', amount: 0 },
        { month: 'Jul', amount: 0 }, { month: 'Aug', amount: 0 }, { month: 'Sep', amount: 0 },
        { month: 'Oct', amount: 0 }, { month: 'Nov', amount: 0 }, { month: 'Dec', amount: 0 }
    ];

    budgets.forEach(b => {
        if (b.dateDebut) {
            const date = new Date(b.dateDebut);
            const monthIndex = date.getMonth();
            if (monthIndex >= 0 && monthIndex < 12) {
                monthlyBudgetData[monthIndex].amount += b.montantInitial;
            }
        }
    });

    const categoryData = categories.map(cat => ({
        name: cat.nom,
        value: products.filter(p =>
            p.category?.id === cat.id || p.id_categorie === cat.id
        ).length
    })).filter(item => item.value > 0);

    const stockAnalysis = products
        .map(p => ({
            name: p.nom.length > 12 ? p.nom.substring(0, 10) + '..' : p.nom,
            current: p.quantiteDisponible,
            threshold: p.seuilCritique || 5
        }))
        .sort((a, b) => a.current - b.current)
        .slice(0, 6);

    const COLORS = ['#A5B4FC', '#FCA5A5', '#FCD34D', '#6EE7B7', '#93C5FD', '#F9A8D4'];

    return (
        <div className="analytics-container" style={{ padding: '30px', background: 'transparent', borderRadius: '20px' }}>
            <div className="hub-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '800', background: 'linear-gradient(90deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Insights & Business Intelligence
                </h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Visual analysis of stock levels and categories</p>
            </div>

            <div className="analytics-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '30px'
            }}>

                {/* 1. Monthly Budget (Full Width) */}
                <div className="panel glass-panel" style={{
                    gridColumn: '1 / -1',
                    padding: '30px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    <h4 style={{marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#4338ca'}}>
                        <span style={{padding: '8px', background: '#e0e7ff', borderRadius: '10px'}}>💰</span> Monthly Budget Allocation
                    </h4>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={monthlyBudgetData}>
                            <defs>
                                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)'}} />
                            <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fill="url(#colorBudget)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Catalog Breakdown (Pie) */}
                <div className="panel glass-panel" style={{
                    padding: '30px',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.03)'
                }}>
                    <h4 style={{marginBottom: '20px', color: '#1e293b'}}>📊 Catalog Breakdown</h4>
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={8}
                                dataKey="value"
                            >
                                {categoryData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none"/>
                                ))}
                            </Pie>
                            <Tooltip/>
                            <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Restocking Alert (Bar) */}
                <div className="panel glass-panel" style={{padding: '30px', background: 'white', borderRadius: '24px'}}>
                    <h4 style={{marginBottom: '25px', color: '#1e293b'}}>⚠️ Stock Alerts</h4>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={stockAnalysis} margin={{bottom: 50}}> {/* زدنا الـ margin هنا */}
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis
                                dataKey="name"
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                                height={70}
                                tick={{fontSize: 11}}
                            />
                            <YAxis axisLine={false} tickLine={false}/>
                            <Tooltip/>
                            <Legend verticalAlign="top" align="right" iconType="circle"/>
                            <Bar dataKey="current" fill="#93c5fd" radius={[8, 8, 0, 0]} barSize={25}/>
                            <Bar dataKey="threshold" fill="#fca5a5" radius={[8, 8, 0, 0]} barSize={25}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. Radar (Full Width) */}
                <div className="panel glass-panel" style={{
                    gridColumn: '1 / -1',
                    padding: '40px',
                    marginTop: '20px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                    borderRadius: '24px'
                }}>
                    <h4 style={{textAlign: 'center', marginBottom: '30px', color: '#475569'}}>🌐 Inventory Density
                        Radar</h4>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                            <PolarGrid stroke="#e2e8f0"/>
                            <PolarAngleAxis dataKey="name" tick={{fill: '#64748b', fontSize: 14}}/>
                            <Radar
                                name="Products"
                                dataKey="value"
                                stroke="#a855f7"
                                fill="#a855f7"
                                fillOpacity={0.4}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;