import React, { useState } from 'react';
import { User, Business, Subscription } from '../types';
import { 
  Building2, 
  ChevronDown, 
  Sparkles, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Plus, 
  Check,
  Layers,
  Leaf
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeBusiness: Business | null;
  businesses: Business[];
  subscription: Subscription | null;
  onSwitchBusiness: (id: number) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCreateBusiness?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeBusiness,
  businesses,
  subscription,
  onSwitchBusiness,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  const [bizDropdownOpen, setBizDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const aiUsed = subscription?.usage?.ai_credits_used ?? 0;
  const aiLimit = subscription?.usage?.ai_credits_limit ?? 150;

  return (
    <header className="h-16 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E8E2D9] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Brand & Business Switcher */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 text-left group focus:outline-hidden"
        >
          <div className="w-10 h-10 rounded-full bg-[#7C8363] text-white flex items-center justify-center shadow-md shadow-[#7C8363]/20 font-serif font-bold text-lg group-hover:bg-[#6B7154] transition-all">
            भ
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-serif font-semibold text-[#2D2D26] tracking-tight">BharatAI</span>
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#F2EDE4] text-[#7C8363] border border-[#E8E2D9]">
                OS
              </span>
            </div>
            <span className="text-[10px] text-[#8A8A7C] font-medium tracking-wide block -mt-0.5">
              Autonomous Business OS
            </span>
          </div>
        </button>

        {user && activeBusiness && (
          <div className="relative">
            <button
              onClick={() => setBizDropdownOpen(!bizDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D9] hover:border-[#C9A66B] hover:bg-[#FAF8F5] transition-all text-xs font-medium text-[#2D2D26] shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-[#7C8363]" />
              <span className="max-w-[130px] truncate font-medium">{activeBusiness.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8A7C]" />
            </button>

            {bizDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-[#7C8363]/10 border border-[#E8E2D9] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setBizDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-[#E8E2D9]/60 text-[10px] font-bold uppercase tracking-widest text-[#8A8A7C]">
                  Active Tenant
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onSwitchBusiness(b.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF8F5] transition-colors ${
                        b.id === activeBusiness.id ? 'text-[#7C8363] font-semibold bg-[#F2F4EC]/70' : 'text-[#4A4A40]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-medium">{b.name}</div>
                        <div className="text-[10px] text-[#8A8A7C]">{b.industry || 'General Business'}</div>
                      </div>
                      {b.id === activeBusiness.id && <Check className="w-4 h-4 text-[#7C8363] shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="pt-1 mt-1 border-t border-[#E8E2D9]">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="w-full text-left px-3 py-2 text-xs text-[#7C8363] hover:bg-[#F2F4EC] font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register New Business
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Credits, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Natural Tones AI Credits Badge */}
            <button 
              onClick={() => setActiveTab('billing')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF5EC] border border-[#EADBCE] text-xs text-[#2D2D26] hover:bg-[#F5EEDF] transition-all shadow-2xs"
              title="AI Credits Remaining"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C9A66B]" />
              <span className="font-semibold">{Math.max(0, aiLimit - aiUsed)}</span>
              <span className="text-[#8A8A7C] font-normal">/ {aiLimit} AI Credits</span>
            </button>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-9 h-9 rounded-full bg-white border border-[#E8E2D9] text-[#4A4A40] hover:border-[#7C8363] hover:text-[#7C8363] flex items-center justify-center transition-all relative shadow-2xs"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7C8363] ring-2 ring-white"></span>
              </button>

              {notificationsOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-[#7C8363]/10 border border-[#E8E2D9] p-3.5 z-50 animate-in fade-in duration-150"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#E8E2D9]">
                    <span className="text-xs font-serif font-bold text-[#2D2D26]">Live Notifications</span>
                    <span className="text-[10px] text-[#7C8363] font-bold bg-[#F2F4EC] border border-[#D5DAC7] px-2 py-0.5 rounded-full">
                      System Ready
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                      <div className="font-semibold text-[#2D2D26]">AI Lead Qualified</div>
                      <div className="text-[#8A8A7C] text-[11px] mt-0.5">High purchase intent detected for incoming enterprise inquiry.</div>
                      <div className="text-[10px] text-[#8A8A7C] mt-1">2 mins ago</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
                      <div className="font-semibold text-[#2D2D26]">Knowledge Base Synced</div>
                      <div className="text-[#8A8A7C] text-[11px] mt-0.5">RAG search embeddings updated for AI assistant.</div>
                      <div className="text-[10px] text-[#8A8A7C] mt-1">15 mins ago</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-white border border-[#E8E2D9] hover:border-[#7C8363] transition-all shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-[#7C8363] text-white flex items-center justify-center text-xs font-semibold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8A8A7C]" />
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl shadow-[#7C8363]/10 border border-[#E8E2D9] py-2 z-50 animate-in fade-in duration-150"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-[#E8E2D9]">
                    <div className="text-sm font-semibold text-[#2D2D26] truncate">{user.full_name}</div>
                    <div className="text-xs text-[#8A8A7C] truncate">{user.email}</div>
                    {user.role_id === 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7C8363] bg-[#F2F4EC] border border-[#D5DAC7] px-2 py-0.5 rounded-full mt-2">
                        <Shield className="w-3 h-3" /> Super Admin
                      </span>
                    )}
                  </div>

                  <div className="py-1 text-xs text-[#4A4A40]">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[#8A8A7C]" /> Account Settings
                    </button>
                    {user.role_id === 1 && (
                      <button
                        onClick={() => setActiveTab('admin')}
                        className="w-full text-left px-4 py-2 hover:bg-[#FAF8F5] flex items-center gap-2.5 text-[#7C8363] font-semibold transition-colors"
                      >
                        <Shield className="w-4 h-4 text-[#7C8363]" /> Admin Control Panel
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('billing')}
                      className="w-full text-left px-4 py-2 hover:bg-[#FAF8F5] flex items-center gap-2.5 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-[#8A8A7C]" /> Subscriptions & Limits
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#E8E2D9]">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 font-semibold flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-[#4A4A40] hover:text-[#2D2D26] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 rounded-full bg-[#7C8363] hover:bg-[#6B7154] text-white text-xs font-medium shadow-md shadow-[#7C8363]/20 transition-all"
            >
              Start Free Trial
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
