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

    const COLORS = ['#ff9a9e', '#fca5a5', '#730d19', '#e36469', '#ffccd2', '#b33939'];
    const mainGradient = "linear-gradient(135deg, #ff9a9e, #730d19)";
    return (
        <div className="analytics-container" style={{padding: '30px', background: 'transparent', borderRadius: '20px'}}>
            <div className="analytics-container" style={{padding: '30px', background: 'transparent'}}>
                <div className="hub-header" style={{marginBottom: '40px', textAlign: 'center'}}>
                    <h2 style={{
                        fontSize: '2.2rem',
                        fontWeight: '800',
                        color: '#000000',
                        fontFamily: "Berlin Sans FB Demi"
                    }}>
                        Insights & Business Intelligence
                    </h2>
                    <p style={{color: '#e36469', fontSize: '1.1rem'}}>Analyse visuelle des stocks et catégories</p>
                </div>
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
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(115, 13, 25, 0.05)',
                    border: '1px solid #ff9a9e33'
                }}>
                    <h4 style={{
                        marginBottom: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#730d19'
                    }}>
                            <span style={{
                                padding: '8px',
                                background: '#fff0f1',
                                borderRadius: '10px'
                            }}>💰</span> Allocation Budgétaire Mensuelle
                    </h4>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={monthlyBudgetData}>
                            <defs>
                                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ff9a9e" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#730d19" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fff0f1"/>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#e36469'}}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#e36469'}}/>
                            <Tooltip contentStyle={{
                                borderRadius: '15px',
                                border: 'none',
                                boxShadow: '0 10px 20px rgba(115,13,25,0.1)'
                            }}/>
                            <Area type="monotone" dataKey="amount" stroke="#730d19" strokeWidth={3}
                                  fill="url(#colorBudget)"/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Catalog Breakdown (Pie) */}
                <div className="panel glass-panel" style={{
                    padding: '30px',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(115, 13, 25, 0.05)',
                    border: '1px solid #ff9a9e22'
                }}>
                    <h4 style={{marginBottom: '20px', color: '#730d19'}}>📊 Répartition du Catalogue</h4>
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
                <div className="panel glass-panel" style={{
                    padding: '30px',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(115, 13, 25, 0.05)',
                    border: '1px solid #ff9a9e22'
                }}>
                    <h4 style={{marginBottom: '25px', color: '#730d19'}}>⚠️ Alertes de Stock</h4>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={stockAnalysis} margin={{bottom: 50}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fff0f1"/>
                            <XAxis
                                dataKey="name"
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                                height={70}
                                tick={{fontSize: 11, fill: '#e36469'}}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#e36469'}}/>
                            <Tooltip/>
                            <Legend verticalAlign="top" align="right" iconType="circle"/>
                            <Bar name="Actuel" dataKey="current" fill="#ff9a9e" radius={[8, 8, 0, 0]} barSize={25}/>
                            <Bar name="Seuil" dataKey="threshold" fill="#730d19" radius={[8, 8, 0, 0]} barSize={25}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 4. Radar (Full Width) */}
                <div className="panel glass-panel" style={{
                    gridColumn: '1 / -1',
                    padding: '40px',
                    marginTop: '20px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff5f6 100%)',
                    borderRadius: '24px',
                    border: '1px solid #ff9a9e33'
                }}>
                    <h4 style={{textAlign: 'center', marginBottom: '30px', color: '#730d19'}}>🌐 Densité de
                        l'Inventaire</h4>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryData}>
                            <PolarGrid stroke="#ff9a9e"/>
                            <PolarAngleAxis dataKey="name" tick={{fill: '#e36469', fontSize: 14}}/>
                            <Radar
                                name="Produits"
                                dataKey="value"
                                stroke="#730d19"
                                fill="#ff9a9e"
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