import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  DollarSign,
  AlertTriangle,
  Truck,
  Scissors,
  History,
  Settings,
  LogOut
} from 'lucide-react';
import { useInventory } from '../InventoryContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { alertsHistory } = useInventory();
  const pendingAlerts = alertsHistory.filter(a => a.status === 'pendiente').length;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Inventario', path: '/inventory' },
    { icon: Truck, label: 'Compras', path: '/purchases' },
    { icon: DollarSign, label: 'Ventas', path: '/sales' },
    { icon: History, label: 'Historial', path: '/history' },
    { icon: Scissors, label: 'Merma', path: '/scrap-sales' },
  ];

  const handleNavClick = () => {
    // En mobile cierra el drawer al navegar
    if (onClose) onClose();
  };

  return (
    <aside
      className={cn(
        // Base: siempre fijo, fuera de pantalla por defecto en mobile
        "fixed left-0 top-0 h-screen w-64 bg-[#0d0d0d] border-r border-[#1f1f1f] flex flex-col py-6 px-4 z-40",
        // Transición suave
        "transition-transform duration-200 ease-out",
        // En mobile: oculto a la izquierda / visible cuando isOpen=true
        // En lg+: siempre visible (translate-x-0)
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <button
        onClick={() => { navigate('/'); handleNavClick(); }}
        className="flex items-center gap-3 mb-8 px-2 hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#27272a] shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop" 
            alt="FashionTeamWeb"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-base font-black tracking-tight text-[#fafafa]">FashionTeamWeb</span>
      </button>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={handleNavClick}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm font-medium min-h-[44px]",
              isActive 
                ? "bg-brand-primary/10 text-brand-primary" 
                : "text-[#71717a] hover:bg-[#18181b] hover:text-[#fafafa]"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        {/* Alertas — con badge */}
        <NavLink
          to="/alerts"
          onClick={handleNavClick}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm font-medium mt-1 min-h-[44px]",
            isActive 
              ? "bg-status-error/10 text-status-error" 
              : "text-[#71717a] hover:bg-[#18181b] hover:text-[#fafafa]"
          )}
        >
          <AlertTriangle size={18} />
          <span className="flex-1">Alertas</span>
          {pendingAlerts > 0 && (
            <span className="text-[10px] font-black bg-status-error text-white rounded-full w-5 h-5 flex items-center justify-center tabular-nums">
              {pendingAlerts > 9 ? '9+' : pendingAlerts}
            </span>
          )}
        </NavLink>
      </nav>

      {/* Sección inferior */}
      <div className="pt-4 border-t border-[#1f1f1f] space-y-0.5">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm font-medium min-h-[44px]",
            isActive 
              ? "bg-brand-primary/10 text-brand-primary" 
              : "text-[#71717a] hover:bg-[#18181b] hover:text-[#fafafa]"
          )}
        >
          <Settings size={18} />
          Ajustes
        </NavLink>
        <button 
          onClick={async () => { await signOut(); navigate('/login'); handleNavClick(); }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-[#71717a] hover:bg-[#18181b] hover:text-status-error transition-colors text-sm font-medium min-h-[44px]"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
