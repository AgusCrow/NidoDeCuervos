import React, { useState } from 'react';
import { User, Key, Mail, Shield, Check, X, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Player } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Player;
  onRefreshUser: () => void;
}

export const ProfileSettingsModal: React.FC<Props> = ({ isOpen, onClose, currentUser, onRefreshUser }) => {
  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.post('/player/update-profile', {
        name,
        username,
        password: password || undefined
      });
      if (res.data?.success) {
        setMsg({ type: 'SUCCESS', text: res.data.message || 'Perfil actualizado correctamente.' });
        setPassword('');
        onRefreshUser();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setMsg({ type: 'ERROR', text: err.response?.data?.error || err.message || 'Error al actualizar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="theme-card max-w-md w-full p-5 sm:p-6 relative overflow-hidden border-2 border-primary/70 shadow-[0_0_50px_var(--accent-glow)] space-y-5 animate-scaleUp">
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/60 flex items-center justify-center text-primary shadow-[0_0_12px_var(--accent-glow)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-black text-white tracking-wider uppercase">
                AJUSTES DE PERFIL
              </h2>
              <p className="text-[10px] text-gray-300 font-sans">
                Edita los datos de tu aventurero y tu credencial de acceso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-surface-card hover:bg-surface-border text-gray-400 hover:text-white border border-surface-border transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-xl border text-xs font-heading font-bold text-center ${
              msg.type === 'SUCCESS'
                ? 'bg-emerald/10 border-emerald/50 text-emerald'
                : 'bg-crimson/10 border-crimson/50 text-crimson'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Avatar Identity Card */}
          <div className="bg-surface-card p-3 rounded-xl border border-surface-border flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center font-heading font-black text-primary text-base shadow-sm shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-[9px] bg-primary/20 text-primary border border-primary/40 px-1.5 py-0.2 rounded font-mono">
                  Nvl {currentUser.level}
                </span>
              </div>
              <div className="text-[11px] text-magic font-mono">
                Clase: {currentUser.secretClass || currentUser.secret_class} | Rol: {currentUser.role}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-heading text-gray-300 block mb-1 font-bold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Nombre del Personaje
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-surface-card border border-surface-border rounded-xl p-2.5 text-xs text-white font-sans focus:border-primary focus:outline-none"
              placeholder="Ej: Valerius El Voraz"
            />
          </div>

          <div>
            <label className="text-xs font-heading text-gray-300 block mb-1 font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" /> Usuario / Email de Acceso
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-surface-card border border-surface-border rounded-xl p-2.5 text-xs text-white font-sans focus:border-primary focus:outline-none"
              placeholder="usuario@gremio.com"
            />
          </div>

          <div>
            <label className="text-xs font-heading text-gray-300 block mb-1 font-bold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" /> Cambiar Contraseña (Opcional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-xl p-2.5 text-xs text-white font-sans focus:border-primary focus:outline-none"
              placeholder="Deja en blanco para no modificar"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-surface-card hover:bg-surface-border border border-surface-border text-xs font-heading font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 theme-btn-primary py-2.5 text-xs font-heading font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
