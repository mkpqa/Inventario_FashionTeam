import React, { useState } from 'react';
import { useInventory } from '../../InventoryContext';
import { Package, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function StockReport() {
  const { products } = useInventory();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'actual' | 'mensual'>('actual');

  const totalValue = products.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);
  const totalItems = products.reduce((acc, curr) => acc + curr.stock, 0);
  
  // Agrupar por categoría
  const categoryData = products.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.stock;
    return acc;
  }, {});

  const pieData = Object.keys(categoryData).map(key => ({
    name: key,
    value: categoryData[key]
  }));

  const barData = products
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 10)
    .map(p => ({
      name: p.name.substring(0, 15) + '...',
      stock: p.stock
    }));

  const COLORS = ['#a78bfa', '#8b5cf6', '#6d28d9', '#4c1d95', '#2e1065', '#ec4899', '#db2777', '#be185d'];

  return (
    <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-[#27272a] rounded-lg transition-colors text-[#a1a1aa] hover:text-[#fafafa]"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Análisis de Stock</h1>
          <p className="text-sm text-[#a1a1aa]">Visión detallada del inventario actual y variaciones del mes.</p>
        </div>
      </header>

      <div className="flex gap-2 border-b border-[#27272a] pb-4">
        <button
          onClick={() => setTab('actual')}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
            tab === 'actual' ? "bg-brand-primary text-[#09090b]" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          )}
        >
          Stock Actual
        </button>
        <button
          onClick={() => setTab('mensual')}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
            tab === 'mensual' ? "bg-brand-primary text-[#09090b]" : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          )}
        >
          Variación Mensual
        </button>
      </div>

      {tab === 'actual' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Métricas rápidas */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
              <div className="p-4 bg-brand-primary/10 text-brand-primary rounded-xl">
                <Package size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Volumen Total (Unidades)</p>
                <h3 className="text-3xl font-black text-[#fafafa] mt-1">{totalItems}</h3>
              </div>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
              <div className="p-4 bg-green-500/10 text-green-500 rounded-xl">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Valorización Estimada</p>
                <h3 className="text-3xl font-black text-[#fafafa] mt-1">S/ {totalValue.toFixed(2)}</h3>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 h-[400px] flex flex-col shadow-lg">
            <h3 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider mb-6">Top 10 Productos con mayor Stock</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }} />
                  <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 h-[400px] flex flex-col shadow-lg">
            <h3 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider mb-6">Distribución por Categorías</h3>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-[#a1a1aa]">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#18181b] border border-[#27272a] rounded-xl p-12 text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="text-[#a1a1aa]" size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#fafafa]">En Desarrollo</h2>
          <p className="text-[#a1a1aa] mt-2">La variación mensual requiere snapshots históricos del inventario, lo cual se implementará próximamente.</p>
        </motion.div>
      )}
    </div>
  );
}
