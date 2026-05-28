import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { AlertTriangle, ShoppingCart, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Alerts() {
  const { alertsHistory, loading } = useInventory();
  const [filter, setFilter] = useState<'Pendientes' | 'Resueltos' | 'Todos'>('Pendientes');
  const navigate = useNavigate();

  const filteredAlerts = alertsHistory.filter(a => {
    if (filter === 'Todos') return true;
    if (filter === 'Pendientes') return a.status === 'pendiente';
    if (filter === 'Resueltos') return a.status === 'resuelto';
    return true;
  });

  const totalAlerts = alertsHistory.length;
  const pendingCount = alertsHistory.filter(a => a.status === 'pendiente').length;
  const resolvedCount = alertsHistory.filter(a => a.status === 'resuelto').length;

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-[#a1a1aa]">Cargando historial de alertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">

      {/* Encabezado con estado inline — sin cards clonadas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Historial de Alertas</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Reposición de stock y su resolución.</p>
        </div>
        {/* Estado resumido como datos, no como cards */}
        <div className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 shrink-0">
          <span className="text-xl font-black text-[#fafafa] tabular-nums">{totalAlerts}</span>
          <span className="text-xs text-[#52525b] ml-1 mr-4">total</span>
          <span className="w-px h-5 bg-[#27272a]" />
          <span className="text-xl font-black text-status-error tabular-nums ml-4">{pendingCount}</span>
          <span className="text-xs text-[#52525b] ml-1 mr-4">pendientes</span>
          <span className="w-px h-5 bg-[#27272a]" />
          <span className="text-xl font-black text-green-500 tabular-nums ml-4">{resolvedCount}</span>
          <span className="text-xs text-[#52525b] ml-1">resueltas</span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#27272a] pb-4">
        {['Pendientes', 'Resueltos', 'Todos'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab as any)}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              filter === tab 
                ? "bg-brand-primary text-[#09090b]" 
                : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#18181b] border-b border-[#27272a]">
                <th className="py-4 px-6 t-col-header">Fecha Generada</th>
                <th className="py-4 px-6 t-col-header">Producto y SKU</th>
                <th className="py-4 px-6 t-col-header text-center">Tipo</th>
                <th className="py-4 px-6 t-col-header text-center">Estado</th>
                <th className="py-4 px-6 t-col-header">Resolución</th>
                <th className="py-4 px-6 t-col-header text-right w-36">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {filteredAlerts.map((item, idx) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-[#27272a]/20 transition-colors group focus-within:ring-2 focus-within:ring-brand-primary/20"
                >
                  <td className="py-4 px-6 text-xs text-[#a1a1aa] font-mono whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#fafafa]">{item.productName}</span>
                      <span className="t-mono">{item.sku}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full t-badge",
                      item.alertType === 'agotado' ? 'bg-red-900/20 text-red-500 border border-red-500/20' :
                      'bg-status-warning/10 text-status-warning border border-status-warning/20'
                    )}>
                      {item.alertType === 'agotado' ? 'AGOTADO' : 'STOCK BAJO'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      item.status === 'resuelto' 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                    )}>
                      {item.status === 'resuelto' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-[#a1a1aa] font-mono whitespace-nowrap">
                    {item.resolvedAt || '-'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {item.status === 'pendiente' ? (
                      <button 
                        onClick={() => navigate('/purchases')}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-lg hover:bg-brand-primary hover:text-[#09090b] transition-all w-full"
                      >
                        <ShoppingCart size={14} />
                        Reponer
                      </button>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-green-500/50 text-xs font-bold w-full">
                        <CheckCircle2 size={14} />
                        Surtido
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#52525b]">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle size={32} className="opacity-50" />
                      <p className="text-sm">No hay alertas en esta categoría.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
