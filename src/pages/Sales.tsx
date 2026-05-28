import React, { useState } from 'react';
import { useInventory } from '../InventoryContext';
import { ShoppingBag, User, Hash, DollarSign, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Sales() {
  const { products, addSale, loading } = useInventory();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<string | number>(1);
  const [client, setClient] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!selectedProduct || qty <= 0) return;

    if (qty > selectedProduct.stock) {
      setErrorMessage('Stock insuficiente en el inventario real de Supabase.');
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    const saleData = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      quantity: qty,
      unit_price: selectedProduct.price,
      total: selectedProduct.price * qty,
      client,
    };

    try {
      await addSale(saleData);
      
      setLastSale({
        ...saleData,
        date: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })
      });
      setShowSummary(true);
      
      // Reset form
      setSelectedProductId('');
      setQuantity(1);
      setClient('');
    } catch (err: any) {
      console.error('Error al registrar venta:', err);
      setErrorMessage(err.message || 'No se pudo guardar la venta en Supabase.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-[#a1a1aa]">Cargando catálogo para ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Ventas</h1>
        <p className="text-sm text-[#a1a1aa]">Descuenta el stock de tu almacén al registrar una nueva venta.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Form */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-2xl">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="text-status-error text-xs p-3 rounded-lg border border-status-error/20 bg-status-error/10">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="t-label">Producto</label>
              <div className="relative">
                <ShoppingBag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <select 
                  className="w-full h-12 pl-12 pr-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all appearance-none cursor-pointer"
                  value={selectedProductId}
                  onChange={(e) => { setSelectedProductId(e.target.value); setErrorMessage(null); }}
                  required
                >
                  <option value="">Seleccione un producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} | SKU: {p.sku})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="t-label">Cantidad</label>
                <div className="relative">
                  <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    type="number"
                    min="1"
                    className="w-full h-12 pl-12 pr-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="t-label">Precio Unitario</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    type="text"
                    readOnly
                    className="w-full h-12 pl-12 pr-4 bg-[#09090b]/50 border border-[#27272a] rounded-xl text-sm text-[#a1a1aa] cursor-not-allowed"
                    value={selectedProduct ? `S/ ${selectedProduct.price.toFixed(2)}` : '-'}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="t-label">Cliente</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <input 
                  type="text"
                  placeholder="Ej. María López"
                  className="w-full h-12 pl-12 pr-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#a1a1aa]">Total de Venta:</span>
                <span className="text-xl font-black text-brand-primary">
                  {selectedProduct ? `S/ ${(selectedProduct.price * Number(quantity || 0)).toFixed(2)}` : 'S/ 0.00'}
                </span>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full h-14 bg-brand-primary hover:bg-brand-primary-hover text-[#09090b] font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
              disabled={!selectedProduct || Number(quantity) > selectedProduct.stock || processing}
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Procesando Venta...
                </>
              ) : (
                'Confirmar venta'
              )}
            </button>
          </form>
        </div>

        {/* Sales Summary / Confirmation */}
        <AnimatePresence mode="wait">
          {showSummary ? (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-6 shadow-2xl"
            >
              <div className="h-20 w-20 bg-brand-primary rounded-full flex items-center justify-center shadow-2xl shadow-brand-primary/45">
                <CheckCircle size={40} className="text-[#09090b]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-primary mb-2">Venta confirmada</h2>
                <p className="text-sm text-[#a1a1aa]">El stock se descontó correctamente del almacén.</p>
              </div>

              <div className="w-full max-w-sm bg-[#09090b] border border-[#27272a] rounded-2xl p-6 text-left space-y-4">
                <div className="flex items-center gap-3 border-b border-[#27272a] pb-4">
                  <FileText size={18} className="text-brand-primary" />
                  <span className="text-xs font-bold text-[#fafafa] uppercase tracking-widest">Resumen de Venta</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#52525b]">Producto:</span>
                    <span className="text-[#fafafa] font-medium">{lastSale?.productName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#52525b]">SKU:</span>
                    <span className="text-[#fafafa] font-mono font-medium">{lastSale?.sku}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#52525b]">Cantidad:</span>
                    <span className="text-[#fafafa] font-medium">{lastSale?.quantity} unidades</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#52525b]">Cliente:</span>
                    <span className="text-[#fafafa] font-medium">{lastSale?.client}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-[#27272a]">
                    <span className="text-[#a1a1aa] font-bold">Total Pago:</span>
                    <span className="text-brand-primary font-black">S/ {lastSale?.total.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-[#52525b] text-center pt-2">
                    {lastSale?.date}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSummary(false)}
                className="text-sm text-[#fafafa] hover:text-brand-primary transition-colors font-medium border-b border-transparent hover:border-brand-primary cursor-pointer"
              >
                Nueva Venta
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#18181b]/50 border border-[#27272a] border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center text-[#52525b]"
            >
              <FileText size={48} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-sm font-medium italic">Tu resumen de venta aparecerá aquí.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
