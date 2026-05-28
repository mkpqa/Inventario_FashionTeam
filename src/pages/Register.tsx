import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, User, Mail, Building, Lock, EyeOff, Eye, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name,
          company: formData.company
        }
      }
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      navigate('/');
    }
  };

  return (
    <main className="flex min-h-screen w-full bg-[#09090b]">
      {/* Left Pane: Visual context */}
      <section className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-[#27272a]">
        <div className="absolute inset-0 bg-[#09090b] z-0">
          <img 
            alt="Warehouse interior" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity grayscale"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzd2bsILyVKy-8VTZaWp3R1Y0ZVcDMVouenuYyEKURauJeHVuXVTfhIrA8eF4VQBTQhKficQofzlp5yw8F51FIfuXC7bdWdCVXJDGbaOQLRVEF009_j_0nivew1B4A9ct_F8nAlzZOhfQsNTsarHnwZLOroS-DfhOSSJ3LqwpBSt2ysKPiFB6JSgzF3jX6cctY_DvjWTRJWGhm7UfHzYnW1pphdT8WVtnsTWUU1iDgJM9MVYBHN8xJLPwtaE8YxteXUR9oze25pu0" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent z-0" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#27272a] bg-[#18181b] shadow-lg shadow-brand-primary/20">
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop" 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xl font-black text-[#fafafa] tracking-tight">FashionTeamWeb</span>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold text-[#fafafa] mb-6 leading-tight tracking-tight"
          >
            Precisión en cada eslabón de tu cadena.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#a1a1aa] leading-relaxed"
          >
            Únete a gestores de operaciones líderes. Obtén visibilidad en tiempo real, controla tu inventario y optimiza tus procesos logísticos con herramientas diseñadas para la eficiencia.
          </motion.p>
        </div>
      </section>

      {/* Right Pane: Form */}
      <section className="w-full lg:w-7/12 xl:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] flex flex-col gap-8"
        >
          <div className="lg:hidden flex items-center gap-3 mb-4 justify-center">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#27272a] bg-[#18181b] shadow-lg shadow-brand-primary/20">
              <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop" 
                alt="Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-xl font-black text-[#fafafa] tracking-tight">FashionTeamWeb</span>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8 sm:p-10 shadow-2xl">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-[#fafafa] mb-1">Crear cuenta</h1>
              <p className="text-sm text-[#a1a1aa]">Ingresa tus datos para comenzar a optimizar.</p>
            </header>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              {error && (
                <p className="text-xs text-status-error bg-status-error/8 border border-status-error/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest pl-1">Nombre completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    className="w-full h-12 px-12 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] transition-all hover:border-[#3f3f46] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none placeholder:text-[#52525b]" 
                    placeholder="Ej. Carlos Mendoza" 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest pl-1">Correo electrónico</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    className="w-full h-12 px-12 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] transition-all hover:border-[#3f3f46] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none placeholder:text-[#52525b]" 
                    placeholder="carlos@empresa.com" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest pl-1">Nombre de la empresa</label>
                <div className="relative">
                  <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    className="w-full h-12 px-12 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] transition-all hover:border-[#3f3f46] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none placeholder:text-[#52525b]" 
                    placeholder="Logística Global S.A." 
                    type="text" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest pl-1">Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#52525b]" />
                  <input 
                    className="w-full h-12 px-12 bg-[#09090b] border border-[#27272a] rounded-xl text-sm text-[#fafafa] transition-all hover:border-[#3f3f46] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none placeholder:text-[#52525b]" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#fafafa] transition-colors" 
                    type="button"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <button 
                className="w-full h-12 mt-4 bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.98] transition-all text-[#09090b] font-bold rounded-xl shadow-lg shadow-brand-primary/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                type="submit"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#a1a1aa]">
                ¿Ya tienes una cuenta? 
                <Link to="/login" className="text-brand-primary font-bold hover:underline ml-1">Iniciar sesión</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
