import React, { useState } from 'react';
import { Business } from '../types';
import { api } from '../services/api';
import { 
  FileText, 
  TrendingUp, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  Share2, 
  IndianRupee, 
  Copy, 
  Check, 
  RefreshCw,
  Send,
  Leaf
} from 'lucide-react';

interface AIToolSuiteViewProps {
  activeBusiness: Business | null;
}

export const AIToolSuiteView: React.FC<AIToolSuiteViewProps> = ({ activeBusiness }) => {
  const [activeTool, setActiveTool] = useState<
    'proposal' | 'quote' | 'seo' | 'email' | 'review' | 'social'
  >('proposal');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [proposalForm, setProposalForm] = useState({
    client_name: 'Acme Corporation',
    project_scope: 'Enterprise web automation, AI chatbot integration, and automated quotation workflow.',
    budget: '₹ 1,50,000',
    timeline: '3 Weeks',
  });

  const [quoteForm, setQuoteForm] = useState({
    customer_name: 'TechMatrix Pvt Ltd',
    items: 'AI Assistant Setup (1x) - ₹25,000, CRM Lead Automation (1x) - ₹35,000, 1 Year Maintenance - ₹15,000',
    tax_rate: '18% GST',
  });

  const [seoForm, setSeoForm] = useState({
    keyword: 'best business automation software India',
    target_audience: 'Small business owners, founders, agencies',
    tone: 'Professional & Authoritative',
  });

  const [emailForm, setEmailForm] = useState({
    recipient_name: 'Ananya Sharma',
    purpose: 'Proposal follow-up after 3 days with value pitch',
    key_points: 'Free onboarding support included, discount valid until Friday',
  });

  const [reviewForm, setReviewForm] = useState({
    review_text: 'The AI CRM made qualifying leads 5x faster for our team! Highly recommended.',
    sentiment: 'positive',
  });

  const [socialForm, setSocialForm] = useState({
    platform: 'LinkedIn',
    topic: 'How automation eliminates 15 hours of manual data entry every week for founders',
    cta: 'Book a free business automation audit',
  });

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    let params: Record<string, any> = {};
    if (activeTool === 'proposal') params = proposalForm;
    else if (activeTool === 'quote') params = quoteForm;
    else if (activeTool === 'seo') params = seoForm;
    else if (activeTool === 'email') params = emailForm;
    else if (activeTool === 'review') params = reviewForm;
    else if (activeTool === 'social') params = socialForm;

    try {
      const res = await api.generateAITool(activeTool, params);
      setResult(res.output || res.message || 'Generation complete.');
    } catch (err: any) {
      setError(err.message || 'AI generation failed. Check API configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tools = [
    { id: 'proposal', label: 'Proposal Builder', icon: FileText, desc: 'Client proposals with scope & timeline' },
    { id: 'quote', label: 'Quotation Builder', icon: IndianRupee, desc: 'Calculated quote & payment terms' },
    { id: 'seo', label: 'SEO Article Writer', icon: TrendingUp, desc: 'Rankable articles & meta descriptions' },
    { id: 'email', label: 'Email Follow-up', icon: Mail, desc: 'High-conversion sales follow-ups' },
    { id: 'review', label: 'Review Responder', icon: MessageSquare, desc: 'Professional replies for Google/Trustpilot' },
    { id: 'social', label: 'Social Content', icon: Share2, desc: 'LinkedIn, X & Instagram marketing copy' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#C9A66B]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">
            Autonomous Generators
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#2D2D26]">AI Business Tool Suite</h1>
        <p className="text-xs text-[#8A8A7C] mt-1">
          Generate production-ready documents, quotations, proposals, and marketing assets tailored to {activeBusiness?.name || 'your business'}.
        </p>
      </div>

      {/* Tool Selector Tabs in Natural Tones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id as any);
                setResult(null);
                setError(null);
              }}
              className={`p-4 rounded-3xl text-left transition-all border flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-[#7C8363] shadow-md shadow-[#7C8363]/10 ring-2 ring-[#7C8363]/20'
                  : 'bg-white border-[#E8E2D9] hover:border-[#D5CDC0] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${
                isActive ? 'bg-[#7C8363] text-white' : 'bg-[#F2F4EC] text-[#7C8363] border border-[#D5DAC7]'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-serif font-bold text-[#2D2D26]">{t.label}</div>
                <div className="text-[10px] text-[#8A8A7C] mt-0.5 line-clamp-1">{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form & Output Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-serif font-bold text-[#2D2D26] mb-4">
              Configure {tools.find((t) => t.id === activeTool)?.label}
            </h2>

            {activeTool === 'proposal' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Client / Company Name</label>
                  <input
                    type="text"
                    value={proposalForm.client_name}
                    onChange={(e) => setProposalForm({ ...proposalForm, client_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Scope & Deliverables</label>
                  <textarea
                    rows={4}
                    value={proposalForm.project_scope}
                    onChange={(e) => setProposalForm({ ...proposalForm, project_scope: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2D2D26] mb-1">Budget / Price</label>
                    <input
                      type="text"
                      value={proposalForm.budget}
                      onChange={(e) => setProposalForm({ ...proposalForm, budget: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#2D2D26] mb-1">Estimated Timeline</label>
                    <input
                      type="text"
                      value={proposalForm.timeline}
                      onChange={(e) => setProposalForm({ ...proposalForm, timeline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'quote' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={quoteForm.customer_name}
                    onChange={(e) => setQuoteForm({ ...quoteForm, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Line Items & Amounts</label>
                  <textarea
                    rows={4}
                    value={quoteForm.items}
                    onChange={(e) => setQuoteForm({ ...quoteForm, items: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Tax / GST</label>
                  <input
                    type="text"
                    value={quoteForm.tax_rate}
                    onChange={(e) => setQuoteForm({ ...quoteForm, tax_rate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              </div>
            )}

            {activeTool === 'seo' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Target Keyword</label>
                  <input
                    type="text"
                    value={seoForm.keyword}
                    onChange={(e) => setSeoForm({ ...seoForm, keyword: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={seoForm.target_audience}
                    onChange={(e) => setSeoForm({ ...seoForm, target_audience: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Writing Tone</label>
                  <input
                    type="text"
                    value={seoForm.tone}
                    onChange={(e) => setSeoForm({ ...seoForm, tone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              </div>
            )}

            {activeTool === 'email' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Recipient Name</label>
                  <input
                    type="text"
                    value={emailForm.recipient_name}
                    onChange={(e) => setEmailForm({ ...emailForm, recipient_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Goal / Purpose</label>
                  <input
                    type="text"
                    value={emailForm.purpose}
                    onChange={(e) => setEmailForm({ ...emailForm, purpose: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Key Points / Urgency Trigger</label>
                  <textarea
                    rows={3}
                    value={emailForm.key_points}
                    onChange={(e) => setEmailForm({ ...emailForm, key_points: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              </div>
            )}

            {activeTool === 'review' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Customer Review Text</label>
                  <textarea
                    rows={4}
                    value={reviewForm.review_text}
                    onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              </div>
            )}

            {activeTool === 'social' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#2D2D26] mb-1">Platform</label>
                    <select
                      value={socialForm.platform}
                      onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="X/Twitter">X / Twitter</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#2D2D26] mb-1">Call to Action (CTA)</label>
                    <input
                      type="text"
                      value={socialForm.cta}
                      onChange={(e) => setSocialForm({ ...socialForm, cta: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-[#2D2D26] mb-1">Topic / Message</label>
                  <textarea
                    rows={3}
                    value={socialForm.topic}
                    onChange={(e) => setSocialForm({ ...socialForm, topic: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#7C8363] text-white text-xs font-medium hover:bg-[#6B7154] disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-[#7C8363]/20 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate {tools.find((t) => t.id === activeTool)?.label}
              </>
            )}
          </button>
        </div>

        {/* Right: Output Preview */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7C8363]"></span>
                <h3 className="text-sm font-serif font-bold text-[#2D2D26]">Generated Output</h3>
              </div>
              {result && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-full bg-[#F2F4EC] hover:bg-[#E4E8DA] text-[#555C42] text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#7C8363]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              )}
            </div>

            <div className="mt-4">
              {error ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </div>
              ) : result ? (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs leading-relaxed text-[#2D2D26] whitespace-pre-wrap max-h-[420px] overflow-y-auto">
                  {result}
                </div>
              ) : (
                <div className="py-24 text-center text-xs text-[#8A8A7C]">
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-[#C9A66B] opacity-60" />
                  Fill out the parameters on the left and click Generate to see autonomous output.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E2D9] flex items-center justify-between text-[11px] text-[#8A8A7C]">
            <span>Google Gemini Model Router</span>
            <span className="font-serif italic text-[#7C8363]">BharatAI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
