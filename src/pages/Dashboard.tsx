import React from 'react';
import { Package, TrendingUp, ShoppingBag, Truck, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../InventoryContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { products, sales, purchases, alertsHistory } = useInventory();

  const totalValue = products.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);
  const totalUnits = products.reduce((acc, curr) => acc + curr.stock, 0);
  const totalSales = sales.reduce((acc, curr) => acc + curr.total, 0);
  const totalPurchases = purchases.reduce((acc, curr) => acc + curr.total, 0);
  const pendingAlerts = alertsHistory.filter(a => a.status === 'pendiente').length;
  const margin = totalSales - totalPurchases;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Encabezado compacto — sin párrafo redundante */}
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-black text-[#fafafa] tracking-tight">Panel de Control</h1>
        {pendingAlerts > 0 && (
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-2 text-xs font-bold text-status-error border border-status-error/20 bg-status-error/5 px-3 py-1.5 rounded-lg hover:bg-status-error/10 transition-colors"
          >
            <AlertTriangle size={14} />
            {pendingAlerts} alerta{pendingAlerts > 1 ? 's' : ''} pendiente{pendingAlerts > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/*
        Bento Grid — layout asimétrico para comunicar jerarquía:
        - Fila 1: Stock ocupa 2/3 del ancho (es la métrica más importante), Margen 1/3
        - Fila 2: Ventas y Compras lado a lado en igual peso
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* CARD PRIMARIA — Stock Actual (ancho completo en la primera fila col-span-2) */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.35 }}
          onClick={() => navigate('/dashboard/stock')}
          className="lg:col-span-2 bg-[#18181b] border border-[#27272a] rounded-2xl p-8 text-left group hover:border-brand-primary/40 transition-all duration-200 hover:bg-[#1f1f23]"
        >
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <Package size={22} />
              </div>
              <span className="text-sm font-semibold text-[#a1a1aa]">Stock Actual</span>
            </div>
            <ArrowRight size={18} className="text-[#52525b] group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all duration-200" />
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-5xl font-black text-[#fafafa] tracking-tight tabular-nums">
                S/ {totalValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-[#52525b] mt-2">valorización total del inventario</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-2xl font-bold text-brand-primary tabular-nums">{totalUnits}</p>
              <p className="text-xs text-[#52525b] mt-1">unidades en almacén</p>
            </div>
          </div>
        </motion.button>

        {/* CARD SECUNDARIA — Margen Neto (1 columna, métricamente complementaria al stock) */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          onClick={() => navigate('/dashboard/sales')}
          className="bg-[#18181b] border border-[#27272a] rounded-2xl p-7 text-left group hover:border-yellow-500/30 transition-all duration-200 hover:bg-[#1f1f23] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
                <TrendingUp size={22} />
              </div>
              <span className="text-sm font-semibold text-[#a1a1aa]">Margen Neto</span>
            </div>
            <ArrowRight size={18} className="text-[#52525b] group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
          <div>
            <p className={`text-3xl font-black tabular-nums ${margin >= 0 ? 'text-[#fafafa]' : 'text-status-error'}`}>
              {margin >= 0 ? '+' : ''}S/ {margin.toFixed(2)}
            </p>
            <p className="text-xs text-[#52525b] mt-2">ventas menos compras (histórico)</p>
          </div>
        </motion.button>

        {/* CARD — Análisis de Ventas */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.35 }}
          onClick={() => navigate('/dashboard/sales')}
          className="bg-[#18181b] border border-[#27272a] rounded-2xl p-7 text-left group hover:border-yellow-500/30 transition-all duration-200 hover:bg-[#1f1f23]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
                <ShoppingBag size={22} />
              </div>
              <span className="text-sm font-semibold text-[#a1a1aa]">Análisis de Ventas</span>
            </div>
            <ArrowRight size={18} className="text-[#52525b] group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
          <p className="text-3xl font-black text-[#fafafa] tabular-nums mb-1">
            S/ {totalSales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#52525b]">ingresos históricos · {sales.length} operaciones</p>
          <p className="text-[11px] text-yellow-500/70 mt-4 font-medium">Ver por Diario / Semanal / Mensual →</p>
        </motion.button>

        {/* CARD — Análisis de Compras */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.35 }}
          onClick={() => navigate('/dashboard/purchases')}
          className="bg-[#18181b] border border-[#27272a] rounded-2xl p-7 text-left group hover:border-green-500/30 transition-all duration-200 hover:bg-[#1f1f23]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
                <Truck size={22} />
              </div>
              <span className="text-sm font-semibold text-[#a1a1aa]">Análisis de Compras</span>
            </div>
            <ArrowRight size={18} className="text-[#52525b] group-hover:text-green-500 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
          <p className="text-3xl font-black text-[#fafafa] tabular-nums mb-1">
            S/ {totalPurchases.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-[#52525b]">inversión histórica · {purchases.length} lotes</p>
          <p className="text-[11px] text-green-500/70 mt-4 font-medium">Ver por Diario / Semanal / Mensual →</p>
        </motion.button>

        {/* CARD — Stock del Mes (más angosta, complementaria) */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 }}
          onClick={() => navigate('/dashboard/stock')}
          className="bg-[#18181b] border border-[#27272a] rounded-2xl p-7 text-left group hover:border-brand-primary/30 transition-all duration-200 hover:bg-[#1f1f23]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl">
                <TrendingUp size={22} />
              </div>
              <span className="text-sm font-semibold text-[#a1a1aa]">Stock del Mes</span>
            </div>
            <ArrowRight size={18} className="text-[#52525b] group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
          <p className="text-3xl font-black text-[#fafafa] tabular-nums mb-1">{totalUnits}</p>
          <p className="text-xs text-[#52525b]">unidades · {products.length} SKUs activos</p>
          <p className="text-[11px] text-brand-primary/70 mt-4 font-medium">Ver distribución por categoría →</p>
        </motion.button>

      </div>
    </div>
  );
}
