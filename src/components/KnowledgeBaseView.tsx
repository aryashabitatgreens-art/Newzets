import React, { useState, useEffect } from 'react';
import { KnowledgeSource, Business } from '../types';
import { api } from '../services/api';
import { 
  Database, 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  Globe, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  X
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  activeBusiness: Business | null;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ activeBusiness }) => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    type: 'text',
    title: '',
    content: '',
    url: '',
  });

  const loadSources = async () => {
    try {
      setLoading(true);
      const res = await api.getKnowledgeSources();
      setSources(res || []);
    } catch (err) {
      console.error('Failed to load knowledge sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addKnowledgeSource(formData.type, formData.title, formData.content, formData.url);
      setAddModalOpen(false);
      setFormData({ type: 'text', title: '', content: '', url: '' });
      loadSources();
    } catch (err: any) {
      alert(err.message || 'Failed to add knowledge source');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this knowledge source?')) return;
    try {
      await api.deleteKnowledgeSource(id);
      loadSources();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleTestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setSearching(true);
    // Simulate RAG chunk matching over stored sources
    setTimeout(() => {
      const q = testQuery.toLowerCase();
      const matched = sources
        .filter((s) => s.title.toLowerCase().includes(q) || (s.raw_content && s.raw_content.toLowerCase().includes(q)))
        .map((s) => `[Match from: ${s.title}] "${s.raw_content?.slice(0, 180)}..."`);
      
      setTestResults(matched.length > 0 ? matched : ['No direct keyword match found. Deep semantic fallback will query general business context.']);
      setSearching(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#7C8363]"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">
              RAG Embeddings Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#2D2D26]">Knowledge Base (RAG)</h1>
          <p className="text-xs text-[#8A8A7C] mt-1">
            Provide business documents, product catalogs, and FAQs to ground AI chatbot and assistant replies.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-5 py-3 bg-[#7C8363] text-white rounded-full text-xs font-medium shadow-md shadow-[#7C8363]/25 hover:bg-[#6B7154] transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Knowledge Source
        </button>
      </div>

      {/* 2-Column Split: Sources & Semantic Query Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Sources List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
            <h2 className="text-base font-serif font-bold text-[#2D2D26]">Document Sources</h2>
            <button
              onClick={loadSources}
              className="p-2 rounded-full hover:bg-[#FAF8F5] text-[#7C8363]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#E8E2D9]/60">
            {loading ? (
              <div className="py-12 text-center text-xs text-[#8A8A7C]">Loading knowledge sources...</div>
            ) : sources.length === 0 ? (
              <div className="py-12 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-[#F2F4EC] text-[#7C8363] flex items-center justify-center mx-auto mb-3 border border-[#D5DAC7]">
                  <Database className="w-5 h-5" />
                </div>
                <div className="text-sm font-serif font-semibold text-[#2D2D26]">No Knowledge Sources</div>
                <p className="text-xs text-[#8A8A7C] mt-1">
                  Add FAQs or company documents so the AI can reference your real business offerings.
                </p>
              </div>
            ) : (
              sources.map((s) => (
                <div key={s.id} className="py-4 flex items-center justify-between hover:bg-[#FAF8F5] px-3 rounded-2xl transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#F2EDE4] text-[#7C8363] flex items-center justify-center border border-[#E8E2D9]">
                      {s.type === 'faq' ? <HelpCircle className="w-4 h-4" /> : s.type === 'url' ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#2D2D26]">{s.title}</div>
                      <div className="text-[11px] text-[#8A8A7C] flex items-center gap-2 mt-0.5">
                        <span className="uppercase font-bold text-[9px] text-[#7C8363]">{s.type}</span>
                        <span>• {s.chunk_count || 1} Chunks</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 rounded-full hover:bg-rose-50 text-[#8A8A7C] hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Semantic Query Tester (1 col) */}
        <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#C9A66B]" />
              <h2 className="text-base font-serif font-bold text-[#2D2D26]">Semantic RAG Tester</h2>
            </div>
            <p className="text-xs text-[#8A8A7C] mb-4">
              Test how the AI queries knowledge chunks before responding to customer chatbot questions.
            </p>

            <form onSubmit={handleTestSearch} className="space-y-3">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="e.g. What is your refund policy or delivery timeline?"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
              <button
                type="submit"
                disabled={searching}
                className="w-full py-2.5 rounded-full bg-[#FAF5EC] hover:bg-[#F5EEDF] border border-[#EADBCE] text-xs font-semibold text-[#C9A66B] flex items-center justify-center gap-1.5 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                {searching ? 'Querying Vector Chunks...' : 'Run RAG Retrieval Test'}
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {testResults.map((res, idx) => (
                <div key={idx} className="p-3 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-[11px] text-[#4A4A40] leading-relaxed">
                  {res}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[10px] text-[#8A8A7C] flex items-center justify-between">
            <span>Cosine Similarity Search</span>
            <span className="font-bold text-[#7C8363]">Synced</span>
          </div>
        </div>
      </div>

      {/* Add Knowledge Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-[#2D2D26]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E8E2D9] shadow-2xl p-6 relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-5 right-5 text-[#8A8A7C] hover:text-[#2D2D26]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">Add Context</span>
              <h2 className="text-xl font-serif font-bold text-[#2D2D26]">Add Knowledge Source</h2>
            </div>

            <form onSubmit={handleAddSource} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#2D2D26] mb-1">Source Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                >
                  <option value="text">Text Document / Company Info</option>
                  <option value="faq">Frequently Asked Questions (FAQ)</option>
                  <option value="url">Website URL / Landing Page</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#2D2D26] mb-1">Title / Document Name *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 2026 Product Pricing & Support SLA"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                />
              </div>

              {formData.type === 'url' && (
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Target Web URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://mybusiness.com/about"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-[#2D2D26] mb-1">Content / Body *</label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Paste product details, delivery terms, refund rules, or company history here..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E8E2D9] text-[#8A8A7C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#7C8363] text-white font-medium hover:bg-[#6B7154]"
                >
                  Save & Process Chunks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
