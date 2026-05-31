import React from "react";
import {
    ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { FaChartLine, FaOpencart, FaBoxes, FaArrowUp, FaFire, FaSortAmountDown } from "react-icons/fa";
import "./InventoryAnalytics.css";

interface Product {
    id: number;
    nom: string;
    quantiteDisponible: number;
    prixUnitaire: number;
    seuilCritique: number;
    categorieId: number;
}

interface Category {
    id: number;
    name: string;
    nom: string;
}

interface AnalyticsProps {
    products: Product[];
    categories: Category[];
}

const InventoryAnalytics: React.FC<AnalyticsProps> = ({ products, categories }) => {

    const stockValueData = products.map(p => {
        const isCritical = p.quantiteDisponible <= p.seuilCritique;
        return {
            name: p.nom.length > 12 ? `${p.nom.substring(0, 12)}...` : p.nom,
            Value: (p.quantiteDisponible * p.prixUnitaire),
            Quantity: p.quantiteDisponible,
            isCritical: isCritical,
            Status: isCritical ? "Critical Alert" : "Normal"
        };
    });
    const topProductsData = [...stockValueData]
        .sort((a, b) => b.Value - a.Value)
        .slice(0, 8); // أفضل 8 منتجات بالترتيب
    const categoryDistribution = categories.map(cat => {
        const currentCatId = (cat.id )?.toString();

        const count = products.filter(p => {
            if (p.categorieId) return p.categorieId.toString() === currentCatId;

            const pCat = (p as any).categorie || (p as any).category;
            if (pCat) {
                const pCatId = (pCat.id || pCat.idCategorie || pCat._id)?.toString();
                return pCatId === currentCatId;
            }

            if ((p as any).categoryId) return (p as any).categoryId.toString() === currentCatId;

            return false;
        }).length;

        return { name: cat.nom || cat.name, value: count || 0 };
    }).filter(c => c.value > 0);
    const sortedCategoriesData = [...categoryDistribution]
        .sort((a, b) => b.value - a.value);

    const COLORS = ["#730d19", "#ff9a9e", "#e36469", "#b34246", "#ffb4b7"];

    return (
        <div className="analytics-modern-container animate-fade-in">
            <div className="category-modern-header">
                <div className="header-text">
                    <h1>Predictive & Stock Analytics</h1>
                    <p>Real-time asset valuation, category density, and machine learning trend vectors.</p>
                </div>
                <div className="ai-status-badge">Analytics Core Online</div>
            </div>

            <div className="analytics-charts-main-grid">

                <div className="analytics-glass-card chart-wide">
                    <div className="chart-card-header">
                        <h3><FaChartLine/> Financial Asset Valuation & Levels</h3>
                        <span>All Products ({products.length})</span>
                    </div>
                    <div style={{width: "100%", height: 300}}>
                        <ResponsiveContainer>
                            <AreaChart data={stockValueData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff9a9e" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#730d19" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#f8f0ee" vertical={false}/>
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false}
                                       tick={{fill: '#e36469'}}/>
                                <YAxis yAxisId="left" fontSize={10} axisLine={false} tickLine={false}
                                       tick={{fill: '#730d19'}}/>
                                <YAxis yAxisId="right" orientation="right" fontSize={10} axisLine={false}
                                       tickLine={false} tick={{fill: '#e36469'}}/>
                                <Tooltip contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #ff9a9e',
                                    boxShadow: '0 5px 15px rgba(114, 15, 42, 0.05)'
                                }}/>
                                <Legend verticalAlign="top" height={36} iconType="circle"/>
                                <Area yAxisId="left" type="monotone" dataKey="Value" name="Stock Value (DH)"
                                      stroke="#730d19" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)"/>
                                <Bar yAxisId="right" dataKey="Quantity" name="Available Units" fill="#e36469"
                                     barSize={12} radius={[4, 4, 0, 0]}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="analytics-glass-card chart-pie">
                    <div className="chart-card-header">
                        <h3><FaOpencart/> Category Density</h3>
                        <span>SKUs Share</span>
                    </div>
                    <div style={{
                        width: "100%",
                        height: 260,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={categoryDistribution.length > 0 ? categoryDistribution : [{
                                        name: "Empty",
                                        value: 1
                                    }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {categoryDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}}/>
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8}
                                        wrapperStyle={{fontSize: '10px', fontFamily: 'Berlin Sans FB Demi'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>


                <div className="analytics-glass-card chart-full-wide">
                    <div className="chart-card-header">
                        <h3><FaBoxes/> AI Inventory Optimization Vector</h3>
                        <div className="chart-custom-legend"
                             style={{display: "flex", gap: "16px", alignItems: "center"}}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                                fontWeight: "bold"
                            }}>
                                <span style={{
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "4px",
                                    backgroundColor: "#730d19",
                                    display: "inline-block"
                                }}></span>
                                <span style={{color: "#730d19"}}>Critical Stock</span>
                            </div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.85rem",
                                fontWeight: "bold"
                            }}>
                                <span style={{
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "4px",
                                    backgroundColor: "#ff9a9e",
                                    display: "inline-block"
                                }}></span>
                                <span style={{color: "#e36469"}}>Normal Stock</span>
                            </div>
                        </div>
                    </div>

                    <div className="analytics-pulse-metric">
                        <span className="pulse-icon"><FaArrowUp/></span>
                        <div>
                            <h2>{products.filter(p => p.quantiteDisponible <= p.seuilCritique).length} SKUs</h2>
                            <p>Require immediate algorithmic procurement dispatch based on critical threshold
                                breaches.</p>
                        </div>
                    </div>

                    <div style={{width: "100%", height: 280, marginTop: "15px"}}>
                        <ResponsiveContainer>
                            <ComposedChart data={stockValueData}>
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false}
                                       tick={{fill: '#e36469'}}/>
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#730d19'}}/>

                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #ff9a9e',
                                        fontFamily: 'Berlin Sans FB Demi'
                                    }}
                                    itemStyle={{fontWeight: 'bold'}}
                                />

                                <Bar dataKey="Quantity" name="Units" barSize={16} radius={[4, 4, 0, 0]}>
                                    {/* تلوين الأعمدة ديناميكياً */}
                                    {stockValueData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.isCritical ? "#730d19" : "#ff9a9e"}
                                        />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InventoryAnalytics;