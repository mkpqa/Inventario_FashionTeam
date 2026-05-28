import React, { useState, useMemo } from 'react';
import { useInventory } from '../../InventoryContext';
import { ShoppingBag, ArrowLeft, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function SalesReport() {
  const { sales } = useInventory();
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
    const grouped = sales.reduce((acc: any, sale) => {
      const date = parseDate(sale.date);
      let key = '';

      if (period === 'diario') {
        key = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
      } else if (period === 'semanal') {
        key = `Semana ${getWeekNumber(date)}`;
      } else if (period === 'mensual') {
        key = date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
      }

      if (!acc[key]) acc[key] = { name: key, total: 0, items: 0 };
      acc[key].total += sale.total;
      acc[key].items += sale.quantity;
      return acc;
    }, {});

    return Object.values(grouped).reverse(); // Supabase los trae DESC, los invertimos para orden cronológico
  }, [sales, period]);

  const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);

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
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Análisis de Ventas</h1>
          <p className="text-sm text-[#a1a1aa]">Ingresos generados por ventas a clientes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-4 bg-brand-primary/10 text-brand-primary rounded-xl">
            <TrendingUp size={32} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Ingresos Totales Históricos</p>
            <h3 className="text-3xl font-black text-[#fafafa] mt-1">S/ {totalRevenue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-4 bg-status-warning/10 text-status-warning rounded-xl">
            <ShoppingBag size={32} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Total Operaciones</p>
            <h3 className="text-3xl font-black text-[#fafafa] mt-1">{sales.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h3 className="text-sm font-bold text-[#fafafa] uppercase tracking-wider">Evolución de Ventas (S/)</h3>
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
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `S/${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa' }}
                  itemStyle={{ color: '#a78bfa', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="total" name="Ingresos (S/)" stroke="#a78bfa" strokeWidth={4} dot={{ fill: '#18181b', stroke: '#a78bfa', strokeWidth: 2, r: 6 }} activeDot={{ r: 8, fill: '#a78bfa' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#52525b]">
              <ShoppingBag size={48} className="mb-4 opacity-20" />
              <p>No hay datos de ventas para visualizar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
