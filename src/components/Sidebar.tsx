import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Bot, 
  Sparkles, 
  Database, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  ShieldAlert,
  Leaf
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user }) => {
  const isSuperAdmin = user?.role_id === 1 || user?.role_id === 2;

  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'CRM Leads', icon: Users, badge: 'AI Qualify' },
    { id: 'customers', label: 'Customers', icon: UserCheck },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, badge: 'RAG' },
    { id: 'tools', label: 'AI Tool Suite', icon: Sparkles },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'chatbot', label: 'AI Web Chatbot', icon: MessageSquare },
    { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#23241F] text-[#D1C7B7] flex flex-col shrink-0 border-r border-[#383A31] select-none">
      {/* Workspace Header */}
      <div className="p-5 border-b border-[#383A31]/80">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-[#7C8363]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#A8A89A]">
            Enterprise Suite
          </span>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#7C8363] text-white font-semibold shadow-md shadow-[#7C8363]/30'
                  : 'text-[#C5BEB2] hover:bg-[#2F3129] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8F947E]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isActive 
                    ? 'bg-[#60674B] text-white' 
                    : 'bg-[#2F3129] text-[#C9A66B] border border-[#C9A66B]/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <div className="pt-4 mt-4 border-t border-[#383A31]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#8F947E] px-3.5 mb-2">
              System Admin
            </div>
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#C9A66B] text-[#23241F] font-bold shadow-md shadow-[#C9A66B]/20'
                  : 'text-[#C9A66B] hover:bg-[#2F3129]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-[#C9A66B]" />
                <span>Admin Control</span>
              </div>
              <span className="text-[9px] bg-[#1E1F1A] text-[#C9A66B] border border-[#C9A66B]/40 px-1.5 py-0.5 rounded-full font-bold">
                ROOT
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#383A31] bg-[#1B1C17] text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7C8363] animate-pulse"></span>
            <span className="text-[11px] font-medium text-[#D1C7B7]">AI Engine Online</span>
          </div>
          <span className="text-[10px] text-[#787D6C] font-mono">PHP 8.2</span>
        </div>
      </div>
    </aside>
  );
};
