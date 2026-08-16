import React from 'react';
import { DashboardStats, Business } from '../types';
import { 
  Users, 
  TrendingUp, 
  Sparkles, 
  IndianRupee, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight,
  Bot,
  FileText,
  Database,
  Leaf
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  activeBusiness: Business | null;
  onNavigate: (tab: string) => void;
  onOpenAddLead: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  activeBusiness,
  onNavigate,
  onOpenAddLead,
}) => {
  const currencySymbol = activeBusiness?.currency_symbol || '₹';

  const kpis = [
    {
      label: 'Total Leads',
      value: stats?.total_leads ?? 0,
      change: '+12% this month',
      icon: Users,
      color: 'text-[#7C8363]',
      bg: 'bg-[#F2F4EC]',
      border: 'border-[#D5DAC7]',
    },
    {
      label: 'AI Qualified Leads',
      value: stats?.qualified_leads ?? 0,
      change: 'High intent leads',
      icon: Sparkles,
      color: 'text-[#C9A66B]',
      bg: 'bg-[#FAF5EC]',
      border: 'border-[#EADBCE]',
    },
    {
      label: 'Active Customers',
      value: stats?.total_customers ?? 0,
      change: `${stats?.conversion_rate ?? 0}% Conversion Rate`,
      icon: CheckCircle2,
      color: 'text-[#7C8363]',
      bg: 'bg-[#F2F4EC]',
      border: 'border-[#D5DAC7]',
    },
    {
      label: 'Pipeline Value',
      value: `${currencySymbol} ${(stats?.revenue ?? 0).toLocaleString()}`,
      change: 'Active proposals & deals',
      icon: IndianRupee,
      color: 'text-[#5D5D52]',
      bg: 'bg-[#F2EDE4]',
      border: 'border-[#E8E2D9]',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner in Natural Tones */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-8 border border-[#E8E2D9] shadow-xs">
        {/* Subtle decorative natural gradients */}
        <div className="absolute top-[-80px] right-[-40px] w-80 h-80 bg-[#7C8363] opacity-[0.06] rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-100px] left-[-40px] w-96 h-96 bg-[#C9A66B] opacity-[0.08] rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#7C8363]"></span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#7C8363]">
                {activeBusiness?.industry || 'Autonomous Workspace'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2D2D26] leading-tight">
              Welcome back to <span className="italic">{activeBusiness?.name || 'Your Business'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8A7C] max-w-xl mt-2 leading-relaxed">
              Your autonomous business hub is tracking live CRM pipelines, executing AI qualifications, and managing client proposals.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onOpenAddLead}
              className="px-5 py-3 bg-[#7C8363] text-white rounded-full text-xs font-medium shadow-md shadow-[#7C8363]/25 hover:bg-[#6B7154] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Lead
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-5 py-3 bg-white text-[#2D2D26] border border-[#E8E2D9] rounded-full text-xs font-medium hover:bg-[#FAF8F5] transition-all flex items-center gap-2 shadow-2xs"
            >
              <Bot className="w-4 h-4 text-[#7C8363]" /> Ask Business AI
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between hover:border-[#D5CDC0] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8A7C]">
                  {kpi.label}
                </span>
                <div className={`w-9 h-9 rounded-2xl ${kpi.bg} border ${kpi.border} flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-5">
                <div className="text-3xl font-serif font-bold text-[#2D2D26] tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-medium text-[#8A8A7C] mt-1.5 flex items-center gap-1.5">
                  <Leaf className="w-3 h-3 text-[#7C8363]" />
                  {kpi.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Split: Recent Leads & Quick Automation Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent CRM Leads (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
            <div>
              <h2 className="text-lg font-serif font-semibold text-[#2D2D26]">Recent CRM Leads</h2>
              <p className="text-xs text-[#8A8A7C] mt-0.5">Direct inquiries, web chatbot leads, and qualified deals</p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs text-[#7C8363] hover:text-[#6B7154] font-semibold flex items-center gap-1 uppercase tracking-wider"
            >
              All Leads <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#E8E2D9]/60">
            {stats?.recent_leads && stats.recent_leads.length > 0 ? (
              stats.recent_leads.map((lead) => (
                <div key={lead.id} className="py-3.5 flex items-center justify-between hover:bg-[#FAF8F5] px-3 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#F2EDE4] text-[#7C8363] font-serif font-bold text-sm flex items-center justify-center border border-[#E8E2D9]">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#2D2D26]">{lead.name}</div>
                      <div className="text-[11px] text-[#8A8A7C]">{lead.company || 'Direct Client'} • {lead.location || 'India'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {lead.ai_score ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#F2F4EC] text-[#7C8363] border border-[#D5DAC7] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#7C8363]" />
                        Score: {lead.ai_score}/100
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8A8A7C]">Pending AI Score</span>
                    )}

                    <span className="text-xs font-serif font-bold text-[#2D2D26] ml-2">
                      {currencySymbol} {(Number(lead.estimated_value) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#8A8A7C]">
                No leads recorded yet. Click <span className="font-semibold text-[#7C8363] cursor-pointer" onClick={onOpenAddLead}>Add Lead</span> to start your pipeline.
              </div>
            )}
          </div>
        </div>

        {/* AI Workflows & Tools Shortcut (1 col) */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#C9A66B]" />
              <h2 className="text-lg font-serif font-semibold text-[#2D2D26]">AI Tool Suite</h2>
            </div>
            <p className="text-xs text-[#8A8A7C] mb-5">Autonomous generators powered by Google Gemini</p>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('tools')}
                className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9] hover:border-[#7C8363] hover:bg-[#FAF8F5] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F2F4EC] text-[#7C8363] flex items-center justify-center border border-[#D5DAC7]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#2D2D26] group-hover:text-[#7C8363]">Proposal Generator</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A7C] group-hover:text-[#7C8363]" />
                </div>
                <p className="text-[11px] text-[#8A8A7C] mt-2">Generate client-ready proposals from scope</p>
              </button>

              <button
                onClick={() => onNavigate('tools')}
                className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9] hover:border-[#7C8363] hover:bg-[#FAF8F5] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#FAF5EC] text-[#C9A66B] flex items-center justify-center border border-[#EADBCE]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#2D2D26] group-hover:text-[#7C8363]">SEO Content Writer</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A7C] group-hover:text-[#7C8363]" />
                </div>
                <p className="text-[11px] text-[#8A8A7C] mt-2">Create rankable articles, meta tags & FAQs</p>
              </button>

              <button
                onClick={() => onNavigate('knowledge')}
                className="w-full p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9] hover:border-[#7C8363] hover:bg-[#FAF8F5] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F2EDE4] text-[#5D5D52] flex items-center justify-center border border-[#E8E2D9]">
                      <Database className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#2D2D26] group-hover:text-[#7C8363]">Knowledge Base (RAG)</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A7C] group-hover:text-[#7C8363]" />
                </div>
                <p className="text-[11px] text-[#8A8A7C] mt-2">Manage business context and custom data</p>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E8E2D9] flex items-center justify-between text-xs text-[#8A8A7C]">
            <span className="font-serif italic text-[#7C8363]">BharatAI Business OS</span>
            <span className="font-mono text-[10px]">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
