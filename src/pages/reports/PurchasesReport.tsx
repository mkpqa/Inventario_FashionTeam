import React, { useState, useMemo } from 'react';
import { useInventory } from '../../InventoryContext';
import { Truck, ArrowLeft, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function PurchasesReport() {
  const { purchases } = useInventory();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'diario' | 'semanal' | 'mensual'>('diario');

  const parseDate = (dateStr: string) => {
    try {
      const [datePart] = dateStr.split(', ');
      const [day, month, year] = datePart.split('/');
      return new Date(Number(year), Number(month) - 1, Number(day));
    } catch {
      return new Date();
    }
  };

  const getWeekNumber = (d: Date) => {
    const dCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dCopy.getUTCDay() || 7;
    dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(),0,1));
    return Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  };

  const chartData = useMemo(() => {
    const grouped = purchases.reduce((acc: any, purchase) => {
      const date = parseDate(purchase.date);
      let key = '';

      if (period === 'diario') {
        key = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      } else if (period === 'semanal') {
        key = `Semana ${getWeekNumber(date)}`;
      } else if (period === 'mensual') {
        key = date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
      }

      if (!acc[key]) acc[key] = { name: key, total: 0 };
      acc[key].total += purchase.total;
      return acc;
    }, {});

    return Object.values(grouped).reverse();
  }, [purchases, period]);

  const totalExpense = purchases.reduce((acc, curr) => acc + curr.total, 0);

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
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Análisis de Compras</h1>
          <p className="text-sm text-[#a1a1aa]">Gastos e inversión en reposición de inventario.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-xl">
            <TrendingDown size={32} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Inversión Total Histórica</p>
            <h3 className="text-3xl font-black text-[#fafafa] mt-1">S/ {totalExpense.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-4 bg-[#3f3f46] text-[#fafafa] rounded-xl">
            <Truck size={32} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Lotes de Reposición</p>
            <h3 className="text-3xl font-black text-[#fafafa] mt-1">{purchases.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h3 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider">Evolución de Compras (S/)</h3>
          <div className="flex gap-2 bg-[#09090b] p-1 rounded-lg border border-[#27272a]">
            {['diario', 'semanal', 'mensual'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-md transition-all capitalize",
                  period === p ? "bg-[#27272a] text-[#fafafa] shadow" : "text-[#a1a1aa] hover:text-[#fafafa]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `S/${val}`} />
                <Tooltip 
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }}
                  itemStyle={{ color: '#22c55e', fontWeight: 'bold' }}
                />
                <Bar dataKey="total" name="Inversión (S/)" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#52525b]">
              <Truck size={48} className="mb-4 opacity-20" />
              <p>No hay datos de compras para visualizar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
