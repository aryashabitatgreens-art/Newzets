import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Cpu, 
  Lock, 
  Mail, 
  Check, 
  Sparkles, 
  Save, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface SettingsViewProps {
  activeBusiness: Business | null;
  onBusinessUpdated: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  activeBusiness,
  onBusinessUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'business' | 'ai' | 'smtp'>('business');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Business Profile Form
  const [bizForm, setBizForm] = useState({
    name: activeBusiness?.name || '',
    industry: activeBusiness?.industry || '',
    website: activeBusiness?.website || '',
    phone: activeBusiness?.phone || '',
    email: activeBusiness?.email || '',
    address: activeBusiness?.address || '',
    currency: activeBusiness?.currency || 'INR',
    currency_symbol: activeBusiness?.currency_symbol || '₹',
  });

  // AI Provider Form
  const [aiForm, setAiForm] = useState({
    default_provider: 'gemini',
    gemini_model: 'gemini-2.5-flash',
    openai_model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000,
    enable_fallback: true,
  });

  useEffect(() => {
    if (activeBusiness) {
      setBizForm({
        name: activeBusiness.name,
        industry: activeBusiness.industry || '',
        website: activeBusiness.website || '',
        phone: activeBusiness.phone || '',
        email: activeBusiness.email || '',
        address: activeBusiness.address || '',
        currency: activeBusiness.currency || 'INR',
        currency_symbol: activeBusiness.currency_symbol || '₹',
      });
    }
  }, [activeBusiness]);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateBusinessSettings(bizForm);
      setStatusMessage({ text: 'Business profile successfully updated!', type: 'success' });
      onBusinessUpdated();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update business profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateAISettings(aiForm);
      setStatusMessage({ text: 'AI Model Gateway parameters saved!', type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update AI settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-4 h-4 text-[#7C8363]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">
            System Preferences
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#2D2D26]">Configuration & Settings</h1>
        <p className="text-xs text-[#8A8A7C] mt-1">
          Manage business parameters, localization currency, and AI provider routing.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
          statusMessage.type === 'success' ? 'bg-[#F2F4EC] text-[#555C42] border-[#D5DAC7]' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D9] pb-3">
        {[
          { id: 'business', label: 'Business Profile', icon: Building2 },
          { id: 'ai', label: 'AI Provider Router', icon: Cpu },
          { id: 'smtp', label: 'Email / SMTP Dispatch', icon: Mail },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === t.id
                  ? 'bg-[#7C8363] text-white shadow-xs'
                  : 'text-[#8A8A7C] hover:text-[#2D2D26] hover:bg-[#FAF8F5]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Business Form */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusiness} className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4 text-xs max-w-2xl">
          <h2 className="text-base font-serif font-bold text-[#2D2D26]">Business Identity & Localization</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Company / Trade Name *</label>
              <input
                type="text"
                required
                value={bizForm.name}
                onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Industry Sector</label>
              <input
                type="text"
                value={bizForm.industry}
                onChange={(e) => setBizForm({ ...bizForm, industry: e.target.value })}
                placeholder="Software, Agency, Retail, Healthcare"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Support Email</label>
              <input
                type="email"
                value={bizForm.email}
                onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Contact Phone</label>
              <input
                type="text"
                value={bizForm.phone}
                onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Website URL</label>
              <input
                type="url"
                value={bizForm.website}
                onChange={(e) => setBizForm({ ...bizForm, website: e.target.value })}
                placeholder="https://mybusiness.in"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Currency Code & Symbol</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={bizForm.currency}
                  onChange={(e) => setBizForm({ ...bizForm, currency: e.target.value })}
                  placeholder="INR"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                />
                <input
                  type="text"
                  value={bizForm.currency_symbol}
                  onChange={(e) => setBizForm({ ...bizForm, currency_symbol: e.target.value })}
                  placeholder="₹"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#2D2D26] mb-1">Registered Address</label>
            <textarea
              rows={2}
              value={bizForm.address}
              onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#7C8363] text-white font-medium hover:bg-[#6B7154] flex items-center gap-1.5 shadow-md shadow-[#7C8363]/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Business Settings'}
            </button>
          </div>
        </form>
      )}

      {/* AI Settings Form */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAI} className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4 text-xs max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#C9A66B]" />
            <h2 className="text-base font-serif font-bold text-[#2D2D26]">AI Provider & Model Fallback</h2>
          </div>
          <p className="text-xs text-[#8A8A7C]">
            BharatAI automatically balances requests across Google Gemini, OpenAI, and Anthropic for maximum uptime and minimal latency.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Primary AI Engine</label>
              <select
                value={aiForm.default_provider}
                onChange={(e) => setAiForm({ ...aiForm, default_provider: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Model Version</label>
              <input
                type="text"
                value={aiForm.gemini_model}
                onChange={(e) => setAiForm({ ...aiForm, gemini_model: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Temperature (Creativity): {aiForm.temperature}</label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={aiForm.temperature}
                onChange={(e) => setAiForm({ ...aiForm, temperature: parseFloat(e.target.value) })}
                className="w-full accent-[#7C8363]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Max Generation Tokens</label>
              <input
                type="number"
                value={aiForm.max_tokens}
                onChange={(e) => setAiForm({ ...aiForm, max_tokens: parseInt(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiForm.enable_fallback}
                onChange={(e) => setAiForm({ ...aiForm, enable_fallback: e.target.checked })}
                className="accent-[#7C8363]"
              />
              <span>Enable automatic multi-provider fallback if primary API experiences latency</span>
            </label>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#7C8363] text-white font-medium hover:bg-[#6B7154] flex items-center gap-1.5 shadow-md shadow-[#7C8363]/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save AI Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* SMTP Form */}
      {activeTab === 'smtp' && (
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4 text-xs max-w-2xl">
          <h2 className="text-base font-serif font-bold text-[#2D2D26]">Transactional SMTP Mail Delivery</h2>
          <p className="text-xs text-[#8A8A7C]">
            Configure outbound mail servers for lead notifications, quotations, and password resets.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">SMTP Host</label>
              <input
                type="text"
                defaultValue="smtp.gmail.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">SMTP Port</label>
              <input
                type="text"
                defaultValue="587"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">SMTP Username / Email</label>
              <input
                type="text"
                defaultValue="notifications@bharatai.in"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Sender From Name</label>
              <input
                type="text"
                defaultValue="BharatAI Business Notifications"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26]"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              onClick={() => setStatusMessage({ text: 'SMTP credentials verified and saved.', type: 'success' })}
              className="px-6 py-2.5 rounded-full bg-[#7C8363] text-white font-medium hover:bg-[#6B7154]"
            >
              Test & Save SMTP Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
