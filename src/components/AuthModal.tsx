import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  Check, 
  X,
  Phone
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authData: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<'auth' | 'onboarding'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('admin@bharatai.in');
  const [loginPassword, setLoginPassword] = useState('admin123');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBizName, setRegBizName] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginEmail, loginPassword);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.register(regName, regEmail, regPassword, regBizName);
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2D2D26]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl border border-[#E8E2D9] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#8A8A7C] hover:text-[#2D2D26]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#7C8363] text-white flex items-center justify-center font-serif text-xl font-bold mx-auto mb-3 shadow-md shadow-[#7C8363]/20">
            भ
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2D2D26]">
            {isRegister ? 'Create BharatAI Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-[#8A8A7C] mt-1">
            {isRegister
              ? 'Start automating your business CRM & AI workflows'
              : 'Sign in to access your business operating system'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Login / Register Toggle */}
        <div className="flex p-1 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              !isRegister ? 'bg-white text-[#2D2D26] shadow-xs' : 'text-[#8A8A7C]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              isRegister ? 'bg-white text-[#2D2D26] shadow-xs' : 'text-[#8A8A7C]'
            }`}
          >
            Register
          </button>
        </div>

        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A8A7C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A8A7C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#7C8363] text-white font-medium hover:bg-[#6B7154] shadow-md shadow-[#7C8363]/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ramesh Patel"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Business / Agency Name *</label>
              <input
                type="text"
                required
                value={regBizName}
                onChange={(e) => setRegBizName(e.target.value)}
                placeholder="Patel Digital Solutions"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ramesh@pateldigital.in"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Password *</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#7C8363] text-white font-medium hover:bg-[#6B7154] shadow-md shadow-[#7C8363]/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Creating Business OS...' : 'Register & Start Setup'}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-[#E8E2D9] text-center text-[11px] text-[#8A8A7C]">
          <span>Protected with bcrypt hashing, CSRF tokens & multi-tenant isolation</span>
        </div>
      </div>
    </div>
  );
};
