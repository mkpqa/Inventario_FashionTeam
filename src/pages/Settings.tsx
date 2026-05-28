import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Shield, User, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-[#fafafa] tracking-tight">Ajustes de Perfil</h1>
        <p className="text-sm text-[#a1a1aa]">Gestiona tu seguridad y datos de acceso.</p>
      </header>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#27272a] flex items-center gap-3">
          <Shield className="text-brand-primary" size={20} />
          <h2 className="text-lg font-bold text-[#fafafa]">Seguridad de la Cuenta</h2>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="t-label pl-1">Contraseña Actual</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                <input 
                  type="password"
                  className="w-full h-11 px-12 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="t-label pl-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    type="password"
                    className="w-full h-11 px-12 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="t-label pl-1">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    type="password"
                    className="w-full h-11 px-12 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button 
              type="submit"
              className="px-8 h-12 bg-brand-primary text-[#09090b] font-bold rounded-xl hover:bg-brand-primary-hover transition-all flex items-center gap-2"
            >
              Cambiar Contraseña
            </button>

            {saved && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-status-success font-medium text-sm"
              >
                <CheckCircle size={18} />
                Cambios guardados con éxito
              </motion.div>
            )}
          </div>
        </form>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 flex items-center justify-between opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#27272a] flex items-center justify-center text-brand-primary">
            <User size={24} />
          </div>
          <div>
            <h3 className="font-bold text-[#fafafa]">Configuración Avanzada</h3>
            <p className="text-xs text-[#a1a1aa]">Roles y permisos de usuario.</p>
          </div>
        </div>
        <button className="text-xs font-bold text-[#52525b]">Configurar</button>
      </div>
    </div>
  );
}
