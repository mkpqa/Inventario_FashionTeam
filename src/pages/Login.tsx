import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos.' 
        : error.message);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <motion.main 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm px-8 py-10"
      >
        {/* Marca — sin card contenedor extra */}
        <header className="mb-8">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#27272a] mb-5">
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop" 
              alt="FashionTeamWeb"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-black text-[#fafafa] tracking-tight">Iniciar sesión</h1>
          <p className="text-sm text-[#71717a] mt-1">FashionTeamWeb — Gestión de inventario textil</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-status-error bg-status-error/8 border border-status-error/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa]" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={16} />
              <input 
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                autoComplete="email"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors placeholder:text-[#3f3f46]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#a1a1aa]" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]" size={16} />
              <input 
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#fafafa] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-colors placeholder:text-[#3f3f46]"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-[#09090b] font-bold py-2.5 rounded-lg hover:bg-brand-primary-hover transition-colors flex justify-center items-center gap-2 mt-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.main>
    </div>
  );
}
