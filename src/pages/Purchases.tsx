import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, Loader2, Image as ImageIcon, X, Upload } from 'lucide-react';
import { useInventory } from '../InventoryContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CartItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface Supplier {
  id: string;
  name: string;
  logo_url: string | null;
}

export default function Purchases() {
  const { products, addPurchase, loading } = useInventory();
  const [supplier, setSupplier] = useState('');
  
  // Proveedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierFile, setNewSupplierFile] = useState<File | null>(null);
  const [uploadingSupplier, setUploadingSupplier] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (!error && data) {
      setSuppliers(data);
      // Auto-seleccionar el primero si no hay ninguno seleccionado
      if (data.length > 0 && !supplier) {
        setSupplier(data[0].name);
      }
    }
    setLoadingSuppliers(false);
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    setUploadingSupplier(true);
    let logoUrl = null;

    try {
      if (newSupplierFile) {
        const fileExt = newSupplierFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('supplier-logos')
          .upload(filePath, newSupplierFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('supplier-logos')
          .getPublicUrl(filePath);

        logoUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('suppliers')
        .insert([{ name: newSupplierName, logo_url: logoUrl }]);

      if (insertError) throw insertError;

      setShowAddSupplierModal(false);
      setNewSupplierName('');
      setNewSupplierFile(null);
      await fetchSuppliers(); // Refrescar lista

    } catch (error: any) {
      console.error('Error adding supplier:', error);
      alert('Ocurrió un error al guardar el proveedor: ' + error.message);
    } finally {
      setUploadingSupplier(false);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, sku: product.sku, name: product.name, category: product.category, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleConfirmPurchase = async () => {
    setProcessing(true);
    setErrorMessage(null);
    try {
      // Registramos secuencialmente o en paralelo cada ítem del carrito en la tabla de compras
      await Promise.all(
        cart.map(item => 
          addPurchase({
            productId: item.id,
            productName: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.price * item.quantity,
            supplier: supplier
          })
        )
      );

      setCart([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error al procesar compra:', err);
      setErrorMessage(err.message || 'Ocurrió un error al registrar la compra en Supabase.');
    } finally {
      setProcessing(false);
    }
  };

  // Default images based on category
  const getPlaceholderImage = (category: string) => {
    if (category === 'Telas') return 'https://images.unsplash.com/photo-1528322634354-912f20101b0f?q=80&w=300&h=200&auto=format&fit=crop';
    if (category === 'Hilos') return 'https://images.unsplash.com/photo-1589781685233-a3099908cf67?q=80&w=300&h=200&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1544413660-299165566b1d?q=80&w=300&h=200&auto=format&fit=crop'; // Agujas / Others
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-[#a1a1aa]">Cargando catálogo e inventario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Compras a Proveedores</h1>
        <p className="text-sm text-[#a1a1aa]">Haz pedidos a proveedores y actualiza el stock de tu almacén al instante.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Panel: Catalog */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest pl-1">Proveedor</label>
              <button 
                onClick={() => setShowAddSupplierModal(true)}
                className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> Añadir proveedor
              </button>
            </div>
            
            <div className="flex gap-4 items-center">
              {supplier && suppliers.find(s => s.name === supplier)?.logo_url && (
                <div className="w-11 h-11 rounded-xl bg-[#27272a] border border-[#3f3f46] overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img 
                    src={suppliers.find(s => s.name === supplier)?.logo_url!} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <select 
                className="flex-1 h-11 px-4 bg-[#18181b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all disabled:opacity-50"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                disabled={loadingSuppliers}
              >
                {loadingSuppliers ? (
                  <option value="">Cargando proveedores...</option>
                ) : suppliers.length === 0 ? (
                  <option value="">Sin proveedores. Añade uno.</option>
                ) : (
                  suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition-colors group">
                <div className="h-28 overflow-hidden bg-[#1f1f23]/50 flex items-center justify-center p-3 border-b border-[#27272a]">
                  <img 
                    src={product.image_url || getPlaceholderImage(product.category)} 
                    alt={product.name} 
                    className={cn(
                      "w-full h-full transition-transform duration-500 group-hover:scale-105",
                      product.image_url ? "object-contain" : "object-cover"
                    )}
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#fafafa] leading-tight truncate">{product.name}</h3>
                      <p className="text-[10px] font-mono text-[#52525b] mt-0.5">{product.sku}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#27272a] text-[10px] font-semibold text-[#a1a1aa] shrink-0">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-mono text-[#fafafa]">S/ {product.price.toFixed(2)}</p>
                    <button 
                      onClick={() => addToCart(product)}
                      className="px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-lg hover:bg-brand-primary hover:text-[#09090b] transition-all cursor-pointer"
                    >
                      Añadir a la orden
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Purchase Order */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl sticky top-24 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
            <div className="p-5 border-b border-[#27272a] bg-[#09090b]/40">
              <h2 className="text-lg font-bold text-[#fafafa] flex items-center gap-2">
                <ShoppingCart size={18} className="text-brand-primary" />
                Orden de Compra
              </h2>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {errorMessage && (
                <div className="text-status-error text-xs p-3 rounded-lg border border-status-error/20 bg-status-error/10">
                  {errorMessage}
                </div>
              )}

              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-sm text-[#52525b] text-center py-8"
                  >
                    Tu orden está vacía. Añade productos desde el catálogo para empezar.
                  </motion.p>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 bg-[#09090b] p-3 rounded-lg border border-[#27272a]"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-[#fafafa] leading-tight pr-4">{item.name}</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-[#52525b] hover:text-status-error transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-md p-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-[#a1a1aa] hover:text-[#fafafa]">
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-mono w-6 text-center text-[#fafafa]">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-[#a1a1aa] hover:text-[#fafafa]">
                              <Plus size={12} />
                            </button>
                          </div>
                          <p className="text-xs font-mono text-[#fafafa]">S/ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 border-t border-[#27272a] bg-[#09090b]/40 space-y-4">
              <div className="flex justify-between items-end">
                <p className="text-sm text-[#a1a1aa]">Total Estimado</p>
                <p className="text-2xl font-mono font-black text-brand-primary">S/ {totalAmount.toFixed(2)}</p>
              </div>
              
              <button 
                onClick={handleConfirmPurchase}
                disabled={cart.length === 0 || processing}
                className={cn(
                  "w-full h-12 font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2",
                  cart.length > 0 && !processing
                    ? "bg-brand-primary text-[#09090b] hover:bg-brand-primary-hover active:scale-[0.98]" 
                    : "bg-[#27272a] text-[#52525b] cursor-not-allowed"
                )}
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Confirmar orden'
                )}
              </button>
              <p className="text-[10px] text-[#52525b] text-center px-4 leading-tight">
                El stock se sumará inmediatamente a tu almacén.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-[#18181b] border border-status-success/30 shadow-2xl p-4 rounded-xl flex items-center gap-3 z-50"
          >
            <div className="w-8 h-8 rounded-full bg-status-success/20 text-status-success flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#fafafa]">Orden confirmada</p>
              <p className="text-xs text-[#a1a1aa]">El stock se ha sumado a tu almacén.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para Añadir Proveedor */}
      <AnimatePresence>
        {showAddSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAddSupplierModal(false)}
                className="absolute right-4 top-4 text-[#52525b] hover:text-[#fafafa] transition-colors"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-xl font-bold text-[#fafafa] mb-6">Añadir Proveedor</h2>
              
              <form onSubmit={handleAddSupplier} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest pl-1">Nombre de la empresa</label>
                  <input 
                    type="text"
                    required
                    value={newSupplierName}
                    onChange={e => setNewSupplierName(e.target.value)}
                    className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                    placeholder="Textiles Perú S.A."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest pl-1">Logo / Imagen (Opcional)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setNewSupplierFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="flex items-center gap-3 w-full h-12 px-4 bg-[#09090b] border border-[#27272a] border-dashed rounded-xl cursor-pointer hover:border-[#3f3f46] hover:bg-[#27272a]/20 transition-all text-[#a1a1aa] text-sm"
                    >
                      <Upload size={16} />
                      {newSupplierFile ? (
                        <span className="text-[#fafafa] truncate">{newSupplierFile.name}</span>
                      ) : (
                        <span>Seleccionar imagen...</span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={uploadingSupplier || !newSupplierName}
                    className="w-full h-11 bg-brand-primary text-[#09090b] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-brand-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingSupplier ? (
                      <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                    ) : (
                      'Guardar Proveedor'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
