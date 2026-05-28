import React, { useState } from 'react';
import { Scissors, Scale, Package, DollarSign, History, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useInventory } from '../InventoryContext';
import { motion, AnimatePresence } from 'motion/react';

export default function ScrapSales() {
  const { scrapSales, addScrapSale, loading } = useInventory();
  const [formData, setFormData] = useState({
    type: 'Tela',
    unit: 'Bolsa',
    quantity: '',
    unitPrice: '',
    client: '',
    reason: 'Excedente de corte textil'
  });
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalCalculated = (Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quantity || !formData.unitPrice || !formData.client) return;

    setProcessing(true);
    setErrorMessage(null);
    try {
      // Mapeamos los datos del formulario a las columnas exactas de la tabla scrap_sales
      const skuGenerated = `MRM-${formData.type.toUpperCase()}-${formData.unit.toUpperCase()}`;
      await addScrapSale({
        sku: skuGenerated,
        productName: `Merma de ${formData.type} (Por ${formData.unit})`,
        weight: Number(formData.quantity),
        price_per_kg: Number(formData.unitPrice),
        total: totalCalculated,
        buyer: formData.client,
        reason: formData.reason
      });

      setFormData({
        type: 'Tela',
        unit: 'Bolsa',
        quantity: '',
        unitPrice: '',
        client: '',
        reason: 'Excedente de corte textil'
      });
    } catch (err: any) {
      console.error('Error al registrar merma:', err);
      setErrorMessage(err.message || 'No se pudo guardar el registro de merma.');
    } finally {
      setProcessing(false);
    }
  };

  // Métrica consolidada de ventas del mes en tiempo real
  const totalSalesMonth = scrapSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalBagsSold = scrapSales.reduce((sum, sale) => sum + sale.weight, 0);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-[#a1a1aa]">Cargando historial de mermas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Venta de Merma</h1>
        <p className="text-sm text-[#a1a1aa]">Gestión de sobrantes textiles — venta por bolsa o kilo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-widest">Total Merma Vendida</p>
            <h3 className="text-2xl font-black text-[#fafafa]">S/ {totalSalesMonth.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-[#27272a] text-[#a1a1aa] rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-widest">Cantidad Total Vendida</p>
            <h3 className="text-2xl font-black text-[#fafafa]">{totalBagsSold.toFixed(1)} und/kg</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Panel: Form */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#27272a] bg-[#09090b]/40">
              <h2 className="text-lg font-bold text-[#fafafa] flex items-center gap-2">
                <Scissors size={18} className="text-brand-primary" />
                Registrar Merma
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {errorMessage && (
                <div className="text-status-error text-xs p-3 rounded-lg border border-status-error/20 bg-status-error/10">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="t-label pl-1">Tipo de Merma</label>
                <select 
                  className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Tela">Tela</option>
                  <option value="Hilo">Hilo</option>
                  <option value="Mezcla">Mezcla</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="t-label pl-1">Unidad de Venta</label>
                <div className="flex p-1 bg-[#09090b] border border-[#27272a] rounded-xl">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-9 text-sm font-semibold rounded-lg transition-all",
                      formData.unit === 'Bolsa' ? 'bg-[#27272a] text-[#fafafa] shadow-sm' : 'text-[#52525b] hover:text-[#a1a1aa]'
                    )}
                    onClick={() => setFormData({...formData, unit: 'Bolsa'})}
                  >
                    <Package size={14} /> Por Bolsa
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-9 text-sm font-semibold rounded-lg transition-all",
                      formData.unit === 'Kilo' ? 'bg-[#27272a] text-[#fafafa] shadow-sm' : 'text-[#52525b] hover:text-[#a1a1aa]'
                    )}
                    onClick={() => setFormData({...formData, unit: 'Kilo'})}
                  >
                    <Scale size={14} /> Por Kilo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="t-label pl-1">
                    {formData.unit === 'Bolsa' ? 'Cant. Bolsas' : 'Peso (Kg)'}
                  </label>
                  <input 
                    type="number"
                    min="0"
                    step={formData.unit === 'Kilo' ? '0.1' : '1'}
                    className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="t-label pl-1">Precio Unit. (S/)</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.1"
                    className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="t-label pl-1">Cliente / Comprador</label>
                <input 
                  type="text"
                  className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="t-label pl-1">Detalle / Motivo</label>
                <input 
                  type="text"
                  className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Excedente de corte"
                />
              </div>

              <div className="pt-4 border-t border-[#27272a]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-semibold text-[#a1a1aa]">Total Calculado</span>
                  <span className="text-2xl font-black font-mono text-brand-primary">
                    S/ {totalCalculated.toFixed(2)}
                  </span>
                </div>
                <button 
                  type="submit"
                  disabled={processing}
                  className="w-full h-12 bg-brand-primary text-[#09090b] font-bold rounded-xl shadow-lg hover:bg-brand-primary-hover active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Registrar venta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel: History */}
        <div className="flex-1">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-[#27272a] bg-[#09090b]/40 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#fafafa] flex items-center gap-2">
                <History size={18} className="text-[#a1a1aa]" />
                Historial de Ventas de Merma
              </h2>
            </div>
            <div className="overflow-x-auto flex-1 p-2">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#27272a]">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Código / Tipo</th>
                    <th className="py-3 px-4 text-right">Cantidad</th>
                    <th className="py-3 px-4 text-right">Precio Unit.</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4">Cliente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]/50">
                  <AnimatePresence>
                    {scrapSales.map((sale) => (
                      <motion.tr 
                        key={sale.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="hover:bg-[#27272a]/20 transition-colors"
                      >
                        <td className="py-3 px-4 text-xs font-mono text-[#a1a1aa]">{sale.date}</td>
                        <td className="py-3 px-4 text-xs font-semibold text-[#fafafa]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#fafafa]">{sale.productName}</span>
                            <span className="text-[9px] font-mono text-[#52525b]">{sale.sku}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-xs font-mono text-[#fafafa]">
                          {sale.weight.toFixed(1)} {sale.sku.includes('BOLSA') ? 'bolsas' : 'kg'}
                        </td>
                        <td className="py-3 px-4 text-right text-xs font-mono text-[#a1a1aa]">
                          S/ {sale.price_per_kg.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-mono font-bold text-brand-primary">
                          S/ {sale.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#a1a1aa] truncate max-w-[150px]" title={sale.buyer}>
                          {sale.buyer}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {scrapSales.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-[#52525b]">
                  <History size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">Aún no has registrado ninguna venta de merma.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
