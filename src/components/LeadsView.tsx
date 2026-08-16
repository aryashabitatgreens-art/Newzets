import React, { useState, useEffect } from 'react';
import { Lead, Business } from '../types';
import { api } from '../services/api';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  UserCheck, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  IndianRupee,
  RefreshCw,
  X
} from 'lucide-react';

interface LeadsViewProps {
  activeBusiness: Business | null;
  onLeadUpdated?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ activeBusiness, onLeadUpdated }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>();
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  
  // Modals & Drawers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [qualifyingLeadId, setQualifyingLeadId] = useState<number | null>(null);
  const [convertingLeadId, setConvertingLeadId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Lead Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    requirement: '',
    estimated_value: 50000,
    priority: 'medium' as const,
    location: '',
  });

  const currencySymbol = activeBusiness?.currency_symbol || '₹';

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await api.getLeads({
        search: search || undefined,
        status_id: selectedStatus,
        priority: selectedPriority || undefined,
      });
      setLeads(res.leads || []);
      setStatuses(res.statuses || []);
      setSources(res.sources || []);
    } catch (err: any) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [selectedStatus, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(formData);
      setStatusMessage({ text: 'Lead created successfully!', type: 'success' });
      setAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        requirement: '',
        estimated_value: 50000,
        priority: 'medium',
        location: '',
      });
      loadLeads();
      onLeadUpdated?.();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create lead', type: 'error' });
    }
  };

  const handleAIQualify = async (leadId: number) => {
    try {
      setQualifyingLeadId(leadId);
      const res = await api.qualifyLeadWithAI(leadId);
      setStatusMessage({ text: `Lead AI Qualified! Score: ${res.score}/100`, type: 'success' });
      await loadLeads();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({
          ...selectedLead,
          ai_score: res.score,
          ai_intent: res.intent,
          ai_buying_probability: res.buying_probability,
          ai_summary: res.summary,
        });
      }
      onLeadUpdated?.();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'AI Qualification failed', type: 'error' });
    } finally {
      setQualifyingLeadId(null);
    }
  };

  const handleConvertToCustomer = async (leadId: number) => {
    try {
      setConvertingLeadId(leadId);
      await api.convertLeadToCustomer(leadId);
      setStatusMessage({ text: 'Lead successfully converted to Customer!', type: 'success' });
      await loadLeads();
      if (selectedLead?.id === leadId) setSelectedLead(null);
      onLeadUpdated?.();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to convert lead', type: 'error' });
    } finally {
      setConvertingLeadId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#7C8363]"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">
              Pipeline Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2D2D26]">CRM Leads</h1>
          <p className="text-xs text-[#8A8A7C] mt-1">
            AI-driven lead qualification, qualification scoring, and pipeline progression.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-5 py-3 bg-[#7C8363] text-white rounded-full text-xs font-medium shadow-md shadow-[#7C8363]/25 hover:bg-[#6B7154] transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {/* Alert / Notification Feedback */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
          statusMessage.type === 'success' 
            ? 'bg-[#F2F4EC] text-[#555C42] border-[#D5DAC7]' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold px-2">✕</button>
        </div>
      )}

      {/* Filters & Search Toolbar in Natural Tones */}
      <div className="bg-white p-4 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#8A8A7C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, email, company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2D2D26] placeholder-[#8A8A7C] focus:outline-hidden focus:border-[#7C8363] focus:bg-white transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedStatus ?? ''}
            onChange={(e) => setSelectedStatus(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3.5 py-2 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3.5 py-2 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={loadLeads}
            className="p-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-[#7C8363] hover:bg-[#F2F4EC] transition-colors"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leads Table / Cards */}
      <div className="bg-white rounded-3xl border border-[#E8E2D9] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#8A8A7C]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#7C8363]" />
            Loading leads data...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#F2F4EC] text-[#7C8363] flex items-center justify-center mx-auto mb-3 border border-[#D5DAC7]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-semibold text-[#2D2D26]">No Leads Found</h3>
            <p className="text-xs text-[#8A8A7C] max-w-sm mx-auto mt-1 mb-4">
              Add your first prospect manually or connect the AI chatbot to capture inbound inquiries automatically.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#7C8363] text-white text-xs font-medium shadow-md shadow-[#7C8363]/25 hover:bg-[#6B7154] transition-all"
            >
              Add Lead Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#8A8A7C] border-b border-[#E8E2D9] uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Lead / Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">AI Score & Intent</th>
                  <th className="py-3.5 px-4">Estimated Value</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]/60">
                {leads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-[#FAF8F5]/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[#F2EDE4] text-[#7C8363] font-serif font-bold text-xs flex items-center justify-center border border-[#E8E2D9]">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2D2D26]">{lead.name}</div>
                          <div className="text-[11px] text-[#8A8A7C] flex items-center gap-2 mt-0.5">
                            {lead.company && <span>{lead.company}</span>}
                            {lead.email && <span>• {lead.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: `${lead.status_color || '#7C8363'}15`,
                          borderColor: `${lead.status_color || '#7C8363'}40`,
                          color: lead.status_color || '#7C8363',
                        }}
                      >
                        {lead.status_name || 'New'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {lead.ai_score ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C8363]">
                            <Sparkles className="w-3 h-3 text-[#7C8363]" />
                            {lead.ai_score}/100 • {lead.ai_intent || 'Qualified'}
                          </span>
                          <span className="text-[10px] text-[#8A8A7C]">Prob: {lead.ai_buying_probability || 'High'}</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAIQualify(lead.id);
                          }}
                          disabled={qualifyingLeadId === lead.id}
                          className="px-2.5 py-1 rounded-full bg-[#FAF5EC] hover:bg-[#F5EEDF] border border-[#EADBCE] text-[10px] font-semibold text-[#C9A66B] flex items-center gap-1 transition-all"
                        >
                          <Sparkles className="w-3 h-3" />
                          {qualifyingLeadId === lead.id ? 'Qualifying...' : 'AI Qualify'}
                        </button>
                      )}
                    </td>

                    <td className="py-4 px-4 font-serif font-bold text-[#2D2D26]">
                      {currencySymbol} {(Number(lead.estimated_value) || 0).toLocaleString()}
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        lead.priority === 'urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        lead.priority === 'high' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-[#F2F4EC] text-[#7C8363] border border-[#D5DAC7]'
                      }`}>
                        {lead.priority}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleConvertToCustomer(lead.id)}
                          disabled={convertingLeadId === lead.id}
                          className="px-3 py-1.5 rounded-full bg-[#F2F4EC] hover:bg-[#E4E8DA] text-[#555C42] font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          title="Convert to Customer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#7C8363]" />
                          {convertingLeadId === lead.id ? 'Converting...' : 'Convert'}
                        </button>
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 rounded-full hover:bg-[#FAF8F5] text-[#8A8A7C] hover:text-[#2D2D26]"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-[#2D2D26]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E8E2D9] shadow-2xl p-6 relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-5 right-5 text-[#8A8A7C] hover:text-[#2D2D26]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">New Prospect</span>
              <h2 className="text-xl font-serif font-bold text-[#2D2D26]">Add CRM Lead</h2>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#2D2D26] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@company.in"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Tech India"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Bengaluru, Karnataka"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Estimated Value ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({ ...formData, estimated_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2D26] mb-1">Requirement / Notes</label>
                <textarea
                  rows={3}
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  placeholder="Need AI automation setup for customer support and quotation generation..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                ></textarea>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E8E2D9] text-[#8A8A7C] hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#7C8363] text-white font-medium hover:bg-[#6B7154] shadow-md shadow-[#7C8363]/20"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 bg-[#2D2D26]/40 backdrop-blur-xs flex justify-end z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg h-full border-l border-[#E8E2D9] shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">Lead Details</span>
                  <h2 className="text-xl font-serif font-bold text-[#2D2D26]">{selectedLead.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 rounded-full text-[#8A8A7C] hover:text-[#2D2D26]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lead Info Grid */}
              <div className="py-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D9]">
                  <div>
                    <span className="text-[#8A8A7C] block text-[10px] uppercase font-bold">Company</span>
                    <span className="font-semibold text-[#2D2D26]">{selectedLead.company || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-[#8A8A7C] block text-[10px] uppercase font-bold">Estimated Pipeline</span>
                    <span className="font-serif font-bold text-[#2D2D26]">
                      {currencySymbol} {(Number(selectedLead.estimated_value) || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8A8A7C] block text-[10px] uppercase font-bold">Phone</span>
                    <span className="text-[#2D2D26]">{selectedLead.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#8A8A7C] block text-[10px] uppercase font-bold">Email</span>
                    <span className="text-[#2D2D26]">{selectedLead.email || 'N/A'}</span>
                  </div>
                </div>

                {/* AI Qualification Panel */}
                <div className="bg-[#FAF5EC] border border-[#EADBCE] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C9A66B]" />
                      <span className="font-serif font-bold text-[#2D2D26]">AI Qualification Insights</span>
                    </div>
                    <button
                      onClick={() => handleAIQualify(selectedLead.id)}
                      disabled={qualifyingLeadId === selectedLead.id}
                      className="px-3 py-1 bg-[#C9A66B] text-white rounded-full text-[10px] font-semibold hover:bg-[#B59357] transition-all"
                    >
                      {qualifyingLeadId === selectedLead.id ? 'Analyzing...' : 'Re-Run AI Score'}
                    </button>
                  </div>

                  {selectedLead.ai_score ? (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8A8A7C]">Intent Score:</span>
                        <span className="font-bold text-[#7C8363] text-sm">{selectedLead.ai_score}/100</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8A8A7C]">Buying Probability:</span>
                        <span className="font-semibold text-[#2D2D26]">{selectedLead.ai_buying_probability || 'High'}</span>
                      </div>
                      {selectedLead.ai_summary && (
                        <p className="text-[11px] text-[#4A4A40] bg-white p-3 rounded-xl border border-[#EADBCE] mt-2 leading-relaxed">
                          {selectedLead.ai_summary}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#8A8A7C] pt-2">
                      Click "Re-Run AI Score" to analyze customer requirement and intent score using Google Gemini.
                    </p>
                  )}
                </div>

                {selectedLead.requirement && (
                  <div>
                    <span className="text-[#8A8A7C] block text-[10px] uppercase font-bold mb-1">Requirement</span>
                    <p className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-[#2D2D26] leading-relaxed">
                      {selectedLead.requirement}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-between">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 rounded-full border border-[#E8E2D9] text-xs text-[#8A8A7C]"
              >
                Close
              </button>
              <button
                onClick={() => handleConvertToCustomer(selectedLead.id)}
                disabled={convertingLeadId === selectedLead.id}
                className="px-5 py-2.5 rounded-full bg-[#7C8363] text-white text-xs font-medium hover:bg-[#6B7154] flex items-center gap-1.5 shadow-md shadow-[#7C8363]/20"
              >
                <UserCheck className="w-4 h-4" />
                {convertingLeadId === selectedLead.id ? 'Converting...' : 'Convert to Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
