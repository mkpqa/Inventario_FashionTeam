import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInventory } from '../InventoryContext';
import { Product } from '../types';
import {
  ScanBarcode,
  Camera,
  CameraOff,
  ShoppingCart,
  PackagePlus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Keyboard,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';

type ActionMode = 'sell' | 'purchase' | null;
type ScannerMode = 'camera' | 'gun';

export default function Scanner() {
  const { products, addSale, addPurchase } = useInventory();

  // ─── Estado principal ─────────────────────────────────────────────────────
  const [scannerMode, setScannerMode] = useState<ScannerMode>('gun');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Producto encontrado
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState('');

  // Modal de acción
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [client, setClient] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Pistola / teclado rápido
  const gunBufferRef = useRef('');
  const gunTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cámara
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const cameraContainerId = 'scanner-camera-container';

  // ─── Búsqueda de producto por SKU ────────────────────────────────────────
  const findProductBySku = useCallback(
    (code: string) => {
      const trimmed = code.trim().toUpperCase();
      setLastScannedCode(trimmed);
      const product = products.find(
        (p) => p.sku.trim().toUpperCase() === trimmed
      );
      if (product) {
        setFoundProduct(product);
        setScanError(null);
      } else {
        setFoundProduct(null);
        setScanError(`No se encontró ningún producto con el código: "${trimmed}"`);
      }
    },
    [products]
  );

  // ─── Listener para pistola / teclado ─────────────────────────────────────
  useEffect(() => {
    if (scannerMode !== 'gun') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input del modal
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (gunBufferRef.current.length > 0) {
          findProductBySku(gunBufferRef.current);
          gunBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        gunBufferRef.current += e.key;
        // Auto-limpiar si no llega un Enter en 500 ms (evita basura)
        if (gunTimerRef.current) clearTimeout(gunTimerRef.current);
        gunTimerRef.current = setTimeout(() => {
          gunBufferRef.current = '';
        }, 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gunTimerRef.current) clearTimeout(gunTimerRef.current);
    };
  }, [scannerMode, findProductBySku]);

  // ─── Cámara: iniciar / detener ────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);

    // Pequeño delay para garantizar que el div contenedor ya está en el DOM
    await new Promise((r) => setTimeout(r, 80));

    const el = document.getElementById(cameraContainerId);
    if (!el) {
      setCameraError('Error interno: contenedor de cámara no encontrado. Intenta de nuevo.');
      return;
    }

    const tryStart = async (constraints: object): Promise<void> => {
      const scanner = new Html5Qrcode(cameraContainerId);
      html5QrRef.current = scanner;
      await scanner.start(
        constraints,
        { fps: 10, qrbox: { width: 260, height: 130 } },
        (decodedText) => { findProductBySku(decodedText); },
        undefined
      );
    };

    try {
      // Intentar primero con cámara trasera (celulares)
      await tryStart({ facingMode: 'environment' });
      setCameraActive(true);
    } catch (err1: any) {
      // Si falla (laptops sin cámara trasera), intentar con cualquier cámara
      try {
        if (html5QrRef.current) {
          try { await html5QrRef.current.stop(); } catch (_) {}
          html5QrRef.current.clear();
          html5QrRef.current = null;
        }
        await tryStart({ facingMode: 'user' });
        setCameraActive(true);
      } catch (err2: any) {
        console.error('Camera error (both attempts failed):', err1, err2);
        setCameraError(
          'No se pudo acceder a la cámara. Verifica que el navegador tiene permisos de cámara habilitados.'
        );
        html5QrRef.current = null;
        setCameraActive(false);
      }
    }
  };

  const stopCamera = async () => {
    if (html5QrRef.current && cameraActive) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (_) {}
    }
    html5QrRef.current = null;
    setCameraActive(false);
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Parar cámara si cambia el modo
  useEffect(() => {
    if (scannerMode === 'gun') stopCamera();
  }, [scannerMode]);

  // ─── Acciones (vender / agregar stock) ───────────────────────────────────
  const openAction = (mode: ActionMode) => {
    setActionMode(mode);
    setQuantity('1');
    setClient('');
    setActionError(null);
    setSuccessMsg(null);
  };

  const closeModal = () => {
    setActionMode(null);
    setSuccessMsg(null);
    setActionError(null);
  };

  const handleConfirm = async () => {
    if (!foundProduct) return;
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setActionError('Ingresa una cantidad válida (mayor a 0).');
      return;
    }

    if (actionMode === 'sell' && qty > foundProduct.stock) {
      setActionError(`Stock insuficiente. Stock actual: ${foundProduct.stock}`);
      return;
    }

    setProcessing(true);
    setActionError(null);

    try {
      if (actionMode === 'sell') {
        await addSale({
          productId: foundProduct.id,
          productName: foundProduct.name,
          sku: foundProduct.sku,
          quantity: qty,
          unit_price: foundProduct.price,
          total: foundProduct.price * qty,
          client: client.trim() || 'Cliente general',
        });
        setSuccessMsg(`✅ Venta registrada: ${qty} × ${foundProduct.name}`);
        // Actualizar stock mostrado localmente
        setFoundProduct((prev) =>
          prev ? { ...prev, stock: prev.stock - qty } : prev
        );
      } else if (actionMode === 'purchase') {
        await addPurchase({
          productId: foundProduct.id,
          productName: foundProduct.name,
          sku: foundProduct.sku,
          quantity: qty,
          unit_price: foundProduct.price,
          total: foundProduct.price * qty,
          supplier: 'Escáner rápido',
        });
        setSuccessMsg(`✅ Stock agregado: +${qty} × ${foundProduct.name}`);
        setFoundProduct((prev) =>
          prev ? { ...prev, stock: prev.stock + qty } : prev
        );
      }

      // Cerrar modal después de 1.5 seg mostrando el éxito
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: any) {
      setActionError(err.message || 'Error al procesar la operación.');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
          <ScanBarcode size={20} className="text-brand-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#fafafa]">Escáner Rápido</h1>
          <p className="text-xs text-[#71717a]">
            Escanea un código de barras para vender o agregar stock al instante
          </p>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2 p-1 bg-[#18181b] rounded-xl w-fit">
        <button
          onClick={() => setScannerMode('gun')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            scannerMode === 'gun'
              ? 'bg-brand-primary text-white shadow-lg'
              : 'text-[#71717a] hover:text-[#fafafa]'
          }`}
        >
          <Keyboard size={16} />
          Pistola / Teclado
        </button>
        <button
          onClick={() => setScannerMode('camera')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            scannerMode === 'camera'
              ? 'bg-brand-primary text-white shadow-lg'
              : 'text-[#71717a] hover:text-[#fafafa]'
          }`}
        >
          <Camera size={16} />
          Cámara
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Izquierdo: Escáner */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden">
          {/* ─ Modo Pistola ─ */}
          <div className={scannerMode === 'gun' ? 'block' : 'hidden'}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard size={18} className="text-brand-primary" />
                <span className="text-sm font-bold text-[#fafafa]">
                  Modo Pistola / Teclado
                </span>
              </div>
              <p className="text-xs text-[#71717a] leading-relaxed">
                Apunta con tu pistola de código de barras a cualquier producto.
                El sistema captura automáticamente el código cuando detecta el
                impulso de <strong className="text-[#a1a1aa]">Enter</strong>{' '}
                al final del escaneo.
              </p>

              {/* Indicador visual */}
              <div className="relative flex flex-col items-center justify-center h-40 bg-[#0d0d0d] rounded-xl border-2 border-dashed border-[#27272a] gap-3">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                >
                  <ScanBarcode size={48} className="text-brand-primary/60" />
                </motion.div>
                <p className="text-xs text-[#52525b]">
                  Esperando escaneo...
                </p>
              </div>

              {/* Búsqueda manual por SKU */}
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5 block">
                  Búsqueda manual por SKU
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" />
                    <input
                      type="text"
                      placeholder="Escribe o pega el código..."
                      className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-brand-primary transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          findProductBySku((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      const input = (e.currentTarget.previousSibling?.firstChild?.nextSibling) as HTMLInputElement;
                      if (input) { findProductBySku(input.value); input.value = ''; }
                    }}
                    className="px-3 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─ Modo Cámara ─ — SIEMPRE montado en el DOM para evitar NotFoundError */}
          <div className={scannerMode === 'camera' ? 'block' : 'hidden'}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera size={18} className="text-brand-primary" />
                <span className="text-sm font-bold text-[#fafafa]">
                  Modo Cámara
                </span>
              </div>
              <p className="text-xs text-[#71717a] leading-relaxed">
                Abre la cámara de tu dispositivo y enfoca el código de barras
                del producto. Funciona tanto en celulares como en laptops.
              </p>

              {/* Contenedor de cámara — SIEMPRE en el DOM */}
              <div
                id={cameraContainerId}
                className={`w-full rounded-xl overflow-hidden bg-[#0d0d0d] border border-[#27272a] ${cameraActive ? 'min-h-[220px]' : 'h-40 flex items-center justify-center'}`}
              >
                {!cameraActive && (
                  <div className="flex flex-col items-center gap-2 text-[#52525b]">
                    <CameraOff size={36} />
                    <p className="text-xs">Cámara inactiva</p>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                  <p className="text-xs text-status-error">{cameraError}</p>
                </div>
              )}

              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  cameraActive
                    ? 'bg-status-error/10 text-status-error border border-status-error/20 hover:bg-status-error/20'
                    : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                }`}
              >
                {cameraActive ? (
                  <><CameraOff size={16} /> Detener cámara</>
                ) : (
                  <><Camera size={16} /> Activar cámara</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Resultado del escaneo */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {/* Código escaneado pero no encontrado */}
            {scanError && !foundProduct && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-status-error/10 border border-status-error/20 rounded-2xl p-6 flex flex-col items-center gap-3 text-center"
              >
                <AlertCircle size={32} className="text-status-error" />
                <div>
                  <p className="text-sm font-bold text-[#fafafa]">Producto no encontrado</p>
                  <p className="text-xs text-[#71717a] mt-1">{scanError}</p>
                </div>
                <p className="text-[11px] text-[#52525b]">
                  Verifica que el SKU esté registrado en el inventario.
                </p>
              </motion.div>
            )}

            {/* Producto encontrado */}
            {foundProduct && (
              <motion.div
                key={foundProduct.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden"
              >
                {/* Info del producto */}
                <div className="p-5 border-b border-[#27272a]">
                  <div className="flex items-start gap-4">
                    {foundProduct.image_url ? (
                      <img
                        src={foundProduct.image_url}
                        alt={foundProduct.name}
                        className="w-16 h-16 rounded-xl object-cover border border-[#27272a] shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                        <ScanBarcode size={24} className="text-brand-primary/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                        {foundProduct.sku}
                      </p>
                      <h2 className="text-base font-bold text-[#fafafa] mt-0.5 truncate">
                        {foundProduct.name}
                      </h2>
                      <p className="text-xs text-[#71717a] mt-0.5">{foundProduct.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-[#0d0d0d] rounded-lg p-3 text-center">
                      <p className="text-[10px] text-[#52525b] uppercase tracking-wide">Precio</p>
                      <p className="text-sm font-bold text-[#fafafa] mt-0.5">
                        S/ {foundProduct.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-[#0d0d0d] rounded-lg p-3 text-center">
                      <p className="text-[10px] text-[#52525b] uppercase tracking-wide">Stock</p>
                      <p className={`text-sm font-bold mt-0.5 ${
                        foundProduct.stock <= 0
                          ? 'text-status-error'
                          : foundProduct.stock <= (foundProduct.min_stock ?? 50)
                          ? 'text-orange-400'
                          : 'text-status-success'
                      }`}>
                        {foundProduct.stock}
                      </p>
                    </div>
                    <div className="bg-[#0d0d0d] rounded-lg p-3 text-center">
                      <p className="text-[10px] text-[#52525b] uppercase tracking-wide">Estado</p>
                      <p className={`text-[11px] font-bold mt-0.5 ${
                        foundProduct.status === 'agotado'
                          ? 'text-status-error'
                          : foundProduct.status === 'stock_bajo'
                          ? 'text-orange-400'
                          : 'text-status-success'
                      }`}>
                        {foundProduct.status === 'agotado'
                          ? 'Agotado'
                          : foundProduct.status === 'stock_bajo'
                          ? 'Stock bajo'
                          : 'En stock'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openAction('sell')}
                    disabled={foundProduct.stock <= 0}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={22} />
                    Vender
                    <span className="text-[10px] font-normal opacity-80">
                      Registrar venta
                    </span>
                  </button>
                  <button
                    onClick={() => openAction('purchase')}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl bg-[#27272a] hover:bg-[#3f3f46] text-[#fafafa] font-bold text-sm active:scale-95 transition-all"
                  >
                    <PackagePlus size={22} className="text-brand-primary" />
                    Agregar Stock
                    <span className="text-[10px] font-normal text-[#71717a]">
                      Entrada de mercancía
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Estado inicial (sin escaneo) */}
            {!foundProduct && !scanError && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#18181b] border border-dashed border-[#27272a] rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
              >
                <ScanBarcode size={40} className="text-[#3f3f46]" />
                <p className="text-sm font-semibold text-[#52525b]">
                  Esperando código de barras
                </p>
                <p className="text-xs text-[#3f3f46] max-w-[240px]">
                  Escanea un producto con la pistola o activa la cámara para comenzar.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Último código escaneado */}
          {lastScannedCode && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-lg">
              <ChevronRight size={12} className="text-[#52525b]" />
              <span className="text-[11px] text-[#52525b]">Último código:</span>
              <span className="text-[11px] font-mono text-brand-primary">{lastScannedCode}</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal de acción (Vender / Agregar Stock) ─────────────────────── */}
      <AnimatePresence>
        {actionMode && foundProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              {/* Header del modal */}
              <div className={`px-5 pt-5 pb-4 flex items-start justify-between border-b border-[#27272a] ${
                actionMode === 'sell' ? 'bg-brand-primary/5' : 'bg-[#0d0d0d]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    actionMode === 'sell'
                      ? 'bg-brand-primary/15 text-brand-primary'
                      : 'bg-[#27272a] text-[#fafafa]'
                  }`}>
                    {actionMode === 'sell' ? <ShoppingCart size={18} /> : <PackagePlus size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#fafafa]">
                      {actionMode === 'sell' ? 'Registrar Venta' : 'Agregar Stock'}
                    </h3>
                    <p className="text-[11px] text-[#71717a] truncate max-w-[180px]">
                      {foundProduct.name}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[#27272a] text-[#71717a] hover:text-[#fafafa] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Cuerpo */}
              {successMsg ? (
                <div className="p-8 flex flex-col items-center gap-3 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <CheckCircle2 size={48} className="text-status-success" />
                  </motion.div>
                  <p className="text-sm font-semibold text-[#fafafa]">{successMsg}</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Precio referencia */}
                  <div className="flex items-center justify-between bg-[#0d0d0d] rounded-lg px-3 py-2.5">
                    <span className="text-xs text-[#71717a]">Precio unitario</span>
                    <span className="text-sm font-bold text-brand-primary">
                      S/ {foundProduct.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5 block">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                      className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-lg px-3 py-2.5 text-base font-bold text-[#fafafa] focus:outline-none focus:border-brand-primary transition-colors text-center"
                    />
                    {actionMode === 'sell' && (
                      <p className="text-[11px] text-[#52525b] mt-1 text-right">
                        Stock disponible: {foundProduct.stock}
                      </p>
                    )}
                  </div>

                  {/* Cliente (solo en venta) */}
                  {actionMode === 'sell' && (
                    <div>
                      <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5 block">
                        Cliente <span className="font-normal normal-case">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre del cliente..."
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
                        className="w-full bg-[#0d0d0d] border border-[#27272a] rounded-lg px-3 py-2.5 text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-brand-primary transition-colors"
                      />
                    </div>
                  )}

                  {/* Total estimado */}
                  <div className="flex items-center justify-between bg-brand-primary/5 border border-brand-primary/15 rounded-lg px-3 py-2.5">
                    <span className="text-xs text-[#71717a]">Total estimado</span>
                    <span className="text-base font-black text-brand-primary">
                      S/ {(foundProduct.price * (parseInt(quantity) || 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Error de acción */}
                  {actionError && (
                    <div className="flex items-start gap-2 bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2.5">
                      <AlertCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                      <p className="text-xs text-status-error">{actionError}</p>
                    </div>
                  )}

                  {/* Botón confirmar */}
                  <button
                    onClick={handleConfirm}
                    disabled={processing}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      actionMode === 'sell'
                        ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                        : 'bg-[#27272a] text-[#fafafa] hover:bg-[#3f3f46]'
                    } disabled:opacity-50`}
                  >
                    {processing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : actionMode === 'sell' ? (
                      <><ShoppingCart size={16} /> Confirmar Venta</>
                    ) : (
                      <><PackagePlus size={16} /> Confirmar Entrada</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
