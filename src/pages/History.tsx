import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, History as HistoryIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function History() {
  const { sales, purchases, loading } = useInventory();
  const [filter, setFilter] = useState<'Todos' | 'Entradas' | 'Salidas'>('Todos');

  // Unificamos las compras (Entradas) y las ventas (Salidas)
  // Nota: Como estamos tomando los datos directamente del contexto tal cual llegaron de la base de datos, 
  // los organizaremos para que coincidan visualmente en la misma tabla de historial.
  const unifiedHistory = [
    ...purchases.map(p => ({
      id: p.id,
      type: 'Entrada',
      date: p.date,
      productName: p.productName,
      sku: p.sku,
      quantity: p.quantity,
      unitPrice: p.unit_price,
      total: p.total,
      entity: p.supplier, // Proveedor
    })),
    ...sales.map(s => ({
      id: s.id,
      type: 'Salida',
      date: s.date,
      productName: s.productName,
      sku: s.sku,
      quantity: s.quantity,
      unitPrice: s.unit_price,
      total: s.total,
      entity: s.client, // Cliente
    }))
  ].sort((a, b) => {
    // Parseamos la fecha 'DD/MM/YYYY, HH:mm:ss' (formato peruano usado en db.ts) para el ordenamiento
    try {
      const parseDate = (dateStr: string) => {
        const [dayPart, timePart] = dateStr.split(', ');
        const [day, month, year] = dayPart.split('/');
        return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
      };
      return parseDate(b.date) - parseDate(a.date);
    } catch {
      return 0; // Si falla el parseo, se mantiene el orden actual
    }
  });

  const filteredHistory = unifiedHistory.filter(item => 
    filter === 'Todos' || item.type === filter.slice(0, -1) // 'Entradas' -> 'Entrada'
  );

  const totalEntradas = unifiedHistory.filter(h => h.type === 'Entrada').reduce((acc, curr) => acc + curr.total, 0);
  const totalSalidas = unifiedHistory.filter(h => h.type === 'Salida').reduce((acc, curr) => acc + curr.total, 0);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-[#a1a1aa]">Cargando el historial de movimientos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">

      {/* Encabezado con balance inline — sin cards redundantes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Historial de Movimientos</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Entradas (compras) y salidas (ventas) de inventario.</p>
        </div>
        {/* Balance de flujos como datos inline, no como cards */}
        <div className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 shrink-0 text-sm">
          <span className="text-xs text-[#52525b] mr-2">Entradas</span>
          <span className="font-black text-green-500 tabular-nums">S/ {totalEntradas.toFixed(2)}</span>
          <span className="w-px h-5 bg-[#27272a] mx-4" />
          <span className="text-xs text-[#52525b] mr-2">Salidas</span>
          <span className="font-black text-brand-primary tabular-nums">S/ {totalSalidas.toFixed(2)}</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 border-b border-[#27272a] pb-4">
        {['Todos', 'Entradas', 'Salidas'].map(tab => (
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

      {/* Tabla de Historial */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#18181b] border-b border-[#27272a]">
                <th className="py-4 px-6 w-12 t-col-header">Tipo</th>
                <th className="py-4 px-6 t-col-header">Fecha y Hora</th>
                <th className="py-4 px-6 t-col-header">Producto y SKU</th>
                <th className="py-4 px-6 t-col-header">Entidad</th>
                <th className="py-4 px-6 t-col-header text-right">Cantidad</th>
                <th className="py-4 px-6 t-col-header text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              <AnimatePresence>
                {filteredHistory.map((item, idx) => (
                  <motion.tr 
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                    className="hover:bg-[#27272a]/20 transition-colors group focus-within:ring-2 focus-within:ring-brand-primary/20"
                  >
                    <td className="py-4 px-6">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg border",
                        item.type === 'Entrada' 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                      )} title={item.type}>
                        {item.type === 'Entrada' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#a1a1aa] font-mono whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#fafafa]">{item.productName}</span>
                        <span className="t-mono">{item.sku}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          item.type === 'Entrada' ? "bg-[#27272a] text-[#a1a1aa]" : "bg-[#27272a] text-[#a1a1aa]"
                        )}>
                          {item.type === 'Entrada' ? 'Proveedor' : 'Cliente'}
                        </span>
                        <span className="text-sm text-[#fafafa] truncate max-w-[150px]">{item.entity}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={cn(
                        "text-sm font-mono font-bold px-2 py-1 rounded",
                        item.type === 'Entrada' ? "text-green-500 bg-green-500/10" : "text-brand-primary bg-brand-primary/10"
                      )}>
                        {item.type === 'Entrada' ? '+' : '-'}{item.quantity} unds
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-mono font-bold text-[#fafafa]">
                      S/ {item.total.toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#52525b]">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowLeftRight size={32} className="opacity-50" />
                      <p className="text-sm">No hay registros para este filtro.</p>
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
