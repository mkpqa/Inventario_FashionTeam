import React, { useState } from 'react';
import { 
  Filter, 
  Download, 
  MoreVertical, 
  Edit2,
  Trash2,
  Plus,
  X,
  Loader2,
  Image as ImageIcon,
  Upload,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory } from '../InventoryContext';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, loading, error } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ sku: '', name: '', category: 'Telas', stock: '', price: '', min_stock: 50 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const exportToExcel = () => {
    const dataToExport = products.map(({ id, ...rest }) => ({
      'SKU': rest.sku,
      'Producto': rest.name,
      'Categoría': rest.category,
      'Stock Actual': rest.stock,
      'Precio Unitario (S/)': rest.price
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, "Inventario_FashionTeam.xlsx");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setModalError(null);

    let uploadedImageUrl = editingProduct ? editingProduct.image_url : null;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${formData.sku || Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-logos')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('product-logos')
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrlData.publicUrl;
      }

      const cleanData = {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        stock: Number(formData.stock) || 0,
        price: Number(formData.price) || 0,
        min_stock: Number(formData.min_stock) || 50,
        image_url: uploadedImageUrl
      };

      if (editingProduct) {
        await updateProduct({ ...cleanData, id: editingProduct.id });
      } else {
        await addProduct(cleanData);
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setFormData({ sku: '', name: '', category: 'Telas', stock: '', price: '', min_stock: 50 });
      setFilePreview(null);
      setSelectedFile(null);
    } catch (err: any) {
      setModalError(err.message || 'Error al guardar los cambios en Supabase.');
    } finally {
      setProcessing(false);
    }
  };

  const startEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({ 
      sku: product.sku, 
      name: product.name, 
      category: product.category, 
      stock: product.stock, 
      price: product.price,
      min_stock: product.min_stock || 50
    });
    setFilePreview(product.image_url || null);
    setSelectedFile(null);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este producto del inventario?')) {
      try {
        await deleteProduct(id);
      } catch (err: any) {
        alert(err.message || 'No se pudo eliminar el producto.');
      }
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
        <p className="text-sm text-[#a1a1aa]">Cargando inventario textil en tiempo real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Control de Inventario Textil</h1>
          <p className="text-sm text-[#a1a1aa]">Mantén el control de tus telas, hilos y suministros.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { 
              setShowAddModal(true); 
              setEditingProduct(null); 
              setFormData({ sku: '', name: '', category: 'Telas', stock: '', price: '', min_stock: 50 }); 
              setFilePreview(null);
              setSelectedFile(null);
              setModalError(null); 
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-[#09090b] text-sm font-bold rounded-lg hover:bg-brand-primary-hover transition-all cursor-pointer"
          >
            <Plus size={16} />
            Añadir producto
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-[#18181b] border border-[#27272a] text-sm text-[#fafafa] rounded-lg hover:bg-[#27272a] transition-all cursor-pointer"
          >
            <Download size={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-status-error/10 border border-status-error/20 p-4 rounded-xl text-status-error text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#18181b] border-b border-[#27272a]">
                <th className="py-4 px-6 t-col-header">SKU</th>
                <th className="py-4 px-6 t-col-header">Producto</th>
                <th className="py-4 px-6 t-col-header">Categoría</th>
                <th className="py-4 px-6 t-col-header text-right">Stock Actual</th>
                <th className="py-4 px-6 t-col-header text-right">Precio Unit. (S/)</th>
                <th className="py-4 px-6 t-col-header text-center">Estado</th>
                <th className="py-4 px-6 t-col-header w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {products.map((item, idx) => {
                const isUnderMin = item.stock <= (item.min_stock || 50);
                return (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-[#27272a]/20 transition-colors group focus-within:ring-2 focus-within:ring-brand-primary/20"
                  >
                    <td className="py-4 px-6 text-xs font-mono text-[#52525b]">{item.sku}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#27272a]/40 border border-[#27272a] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="text-[#52525b]" size={18} />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-[#fafafa]">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-[#a1a1aa]">{item.category}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={cn(
                        "text-sm font-mono transition-colors",
                        isUnderMin ? 'text-status-error font-bold' : 'text-[#fafafa]'
                      )}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm font-mono text-[#fafafa]">S/ {item.price.toFixed(2)}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full t-badge",
                        item.stock === 0 ? 'bg-status-error/15 text-status-error border border-status-error/25' :
                        isUnderMin ? 'bg-status-warning/15 text-status-warning border border-status-warning/25' :
                        'bg-status-success/15 text-status-success border border-status-success/25'
                      )}>
                        {item.stock === 0 ? 'Agotado' : isUnderMin ? 'Stock Bajo' : 'En Stock'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => startEdit(item)}
                          className="text-[#52525b] hover:text-brand-primary p-1.5 rounded-full hover:bg-[#27272a] transition-all cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-[#52525b] hover:text-status-error p-1.5 rounded-full hover:bg-[#27272a] transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-[#52525b]">
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#fafafa]">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#52525b] hover:text-[#fafafa] cursor-pointer"><X size={20} /></button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                {modalError && (
                  <div className="bg-status-error/10 border border-status-error/20 p-3 rounded-lg text-status-error text-xs">
                    {modalError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="t-label pl-1">SKU</label>
                    <input 
                      className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" 
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      placeholder="TEX-001"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="t-label pl-1">Categoría</label>
                    <select 
                      className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Telas">Telas</option>
                      <option value="Hilos">Hilos</option>
                      <option value="Agujas">Agujas</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="t-label pl-1">Nombre del Producto</label>
                  <input 
                    className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej. Tela de Algodón Pima"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="t-label pl-1">Stock</label>
                    <input 
                      type="number"
                      className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" 
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="t-label pl-1">Mínimo</label>
                    <input 
                      type="number"
                      className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" 
                      value={formData.min_stock}
                      onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="t-label pl-1">Precio (S/)</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full h-11 px-4 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Upload Image Section */}
                <div className="space-y-1.5">
                  <label className="t-label pl-1">Imagen / Logo del Producto</label>
                  <div className="flex items-center gap-4 p-4 bg-[#09090b] border border-[#27272a] rounded-xl">
                    <div className="w-16 h-16 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-200" />
                      ) : (
                        <Package className="text-[#52525b]" size={24} />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-semibold text-[#fafafa] rounded-lg cursor-pointer transition-colors active:scale-95 duration-100">
                        <Upload size={14} className="text-[#a1a1aa]" />
                        <span>Seleccionar imagen</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                              setFilePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-[#52525b]">Formatos: JPG, PNG, WEBP. Máx: 2MB.</p>
                    </div>
                    {filePreview && (
                      <button 
                        type="button" 
                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                        className="text-[#52525b] hover:text-status-error p-1.5 rounded-lg hover:bg-[#18181b] transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={processing}
                  className="w-full h-12 mt-4 bg-brand-primary text-[#09090b] font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    editingProduct ? 'Guardar cambios' : 'Añadir producto'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
