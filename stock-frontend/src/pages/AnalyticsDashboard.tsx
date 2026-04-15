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

    const COLORS = ['#4facfe', 'rgba(35,9,131,0.96)', '#f093fb', '#730d19', '#48c6ef', '#6f86d6'];


    return (


        <div className="analytics-container" style={{ padding: '20px' }}>
            <div className="hub-header" style={{ marginBottom: '30px' }}>
                <h2 className="section-title">Insights & Business Intelligence</h2>
                <p className="section-subtitle">Visual analysis of stock levels and categories</p>
            </div>


            <div className="analytics-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '25px'
            }}>

                {/* --- Chart الجديد: Budget Monthly Trend --- */}
                <div className="panel glass-panel" style={{
                    padding: '20px',
                    gridColumn: '1 / -1', // ياخد العرض كامل
                    minHeight: '350px',
                    background: 'white',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{marginBottom: '15px', color: '#c4b5fd'}}>💰 Monthly Budget Allocation (DH)</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyBudgetData}>
                            <defs>
                                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#c4b5fd" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#c4b5fd" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                            <XAxis dataKey="month"/>
                            <YAxis/>
                            <Tooltip/>
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#c4b5fd"
                                fill="url(#colorBudget)"
                                name="Budget Amount"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 1: Donut Chart */}
                <div className="panel glass-panel" style={{
                    padding: '20px',
                    minHeight: '350px',
                    background: 'white',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{marginBottom: '15px', color: '#4facfe'}}>📊 Catalog Breakdown</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                ))}
                            </Pie>
                            <Tooltip/>
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 2: Bar Chart */}
                <div className="panel glass-panel" style={{
                    padding: '20px',
                    minHeight: '350px',
                    background: 'white',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{marginBottom: '15px', color: '#730d19'}}>⚠️ Restocking Alert</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stockAnalysis}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                            <XAxis dataKey="name" tick={{fontSize: 12}}/>
                            <YAxis tick={{fontSize: 12}}/>
                            <Tooltip/>
                            <Legend/>
                            <Bar dataKey="current" fill="#4facfe" radius={[4, 4, 0, 0]} name="Current Stock"/>
                            <Bar dataKey="threshold" fill="#730d19" radius={[4, 4, 0, 0]} name="Critical Threshold"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 3: Radar Chart */}
                <div className="panel glass-panel" style={{
                    padding: '20px',
                    gridColumn: '1 / -1',
                    minHeight: '400px',
                    marginTop: '20px',
                    background: 'white',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{textAlign: 'center', marginBottom: '20px'}}>🌐 Inventory Density Radar</h4>
                    <ResponsiveContainer width="100%" height={350}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                            <PolarGrid stroke="#ccc"/>
                            <PolarAngleAxis dataKey="name" tick={{fill: '#666', fontSize: 13}}/>
                            <Radar
                                name="Quantité de Produits"
                                dataKey="value"
                                stroke="#8884d8"
                                fill="#8884d8"
                                fillOpacity={0.5}
                            />
                            <Tooltip/>
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;