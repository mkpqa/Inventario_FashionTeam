import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, AlertTriangle, Menu, X } from 'lucide-react';
import { useInventory } from '../InventoryContext';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { alertsHistory } = useInventory();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dropdown de campana
  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drawer mobile
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Rastrear alertas ya notificadas en sesión
  const notifiedAlertsRef = useRef<Set<string>>(new Set());

  const pendingAlerts = alertsHistory.filter(a => a.status === 'pendiente');
  const alertCount = pendingAlerts.length;

  // Notificaciones de escritorio
  useEffect(() => {
    if (alertCount > 0 && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        pendingAlerts.forEach(alert => {
          const cacheKey = `${alert.id}`;
          if (!notifiedAlertsRef.current.has(cacheKey)) {
            const title = alert.alertType === 'agotado' ? '❌ Producto Agotado' : '⚠️ Alerta de Stock Bajo';
            const body = alert.alertType === 'agotado'
              ? `El producto "${alert.productName}" (${alert.sku}) se ha agotado por completo.`
              : `A "${alert.productName}" (${alert.sku}) le queda poco stock y requiere reposición.`;
            try {
              new Notification(title, {
                body,
                icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100&h=100&auto=format&fit=crop'
              });
              notifiedAlertsRef.current.add(cacheKey);
            } catch (e) {
              console.error('Error al lanzar notificación:', e);
            }
          }
        });
      }
    }
  }, [pendingAlerts, alertCount]);

  // Cerrar dropdown de campana al click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [bellOpen]);

  // Cerrar drawer al redimensionar a desktop
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setDrawerOpen(false);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Bloquear scroll del body cuando el drawer está abierto en mobile
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleAlertClick = () => {
    setBellOpen(false);
    navigate('/alerts');
  };

  return (
    <div className="flex min-h-screen bg-[#09090b]">

      {/* Overlay mobile — aparece detrás del drawer, cierra al tocar */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — siempre montado, visible/oculto por CSS transform */}
      <Sidebar isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Contenido principal — ml-64 solo en lg+ */}
      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="h-14 border-b border-[#1f1f1f] bg-[#09090b]/90 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">

          {/* Botón hamburguesa — solo visible en mobile */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 rounded-lg text-[#71717a] hover:bg-[#18181b] hover:text-[#fafafa] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} />
          </button>

          {/* Spacer en desktop — header solo tiene acciones a la derecha */}
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* Campana de alertas */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className={`p-2 rounded-full transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center ${
                  bellOpen ? 'bg-[#27272a] text-brand-primary' : 'hover:bg-[#18181b] text-[#71717a]'
                }`}
                aria-label={`Alertas${alertCount > 0 ? `, ${alertCount} pendientes` : ''}`}
                aria-expanded={bellOpen}
                aria-haspopup="true"
              >
                <Bell size={18} className={bellOpen ? 'text-brand-primary' : 'text-[#71717a]'} />
                {alertCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-error rounded-full border border-[#09090b]" />
                )}
              </button>

              {/* Panel de alertas */}
              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl shadow-black z-50 overflow-hidden"
                    role="dialog"
                    aria-label="Panel de alertas"
                  >
                    <header className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-brand-primary" />
                        <h4 className="text-xs font-bold text-[#fafafa]">Alertas pendientes</h4>
                      </div>
                      {alertCount > 0 && (
                        <span className="text-[10px] bg-status-error/15 text-status-error px-2 py-0.5 rounded-full font-bold">
                          {alertCount}
                        </span>
                      )}
                    </header>

                    <div className="max-h-[280px] overflow-y-auto divide-y divide-[#27272a]">
                      {alertCount === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-xs font-semibold text-[#fafafa]">Sin alertas pendientes</p>
                          <p className="text-[11px] text-[#52525b] mt-1">Todo el inventario está al día.</p>
                        </div>
                      ) : (
                        pendingAlerts.slice(0, 5).map(alert => (
                          <button
                            key={alert.id}
                            onClick={handleAlertClick}
                            className="w-full p-3.5 hover:bg-[#27272a]/40 transition-colors flex gap-3 items-start text-left min-h-[44px]"
                          >
                            <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                              alert.alertType === 'agotado' ? 'bg-status-error' : 'bg-orange-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#fafafa] truncate">{alert.productName}</p>
                              <p className="text-[11px] text-[#52525b] mt-0.5">
                                {alert.alertType === 'agotado' ? 'Agotado' : 'Stock bajo'} · {alert.sku}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    <footer className="border-t border-[#27272a]">
                      <button
                        onClick={handleAlertClick}
                        className="w-full py-2.5 text-xs font-semibold text-brand-primary hover:text-[#fafafa] hover:bg-[#27272a] transition-colors"
                      >
                        Ver historial completo →
                      </button>
                    </footer>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full overflow-hidden border border-[#27272a] shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&auto=format&fit=crop"
                  alt={user?.user_metadata?.full_name || "Usuario"}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-medium text-[#71717a] hidden sm:block">
                {user?.user_metadata?.full_name?.split(' ')[0] || "Usuario"}
              </span>
            </div>
          </div>
        </header>

        {/* Padding de contenido — más compacto en mobile */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
