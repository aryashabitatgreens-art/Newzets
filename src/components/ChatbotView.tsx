import React, { useState } from 'react';
import { Business } from '../types';
import { 
  MessageSquare, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Bot, 
  User, 
  Code,
  ShieldCheck
} from 'lucide-react';

interface ChatbotViewProps {
  activeBusiness: Business | null;
}

export const ChatbotView: React.FC<ChatbotViewProps> = ({ activeBusiness }) => {
  const [botName, setBotName] = useState('Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState(
    `Namaste! Welcome to ${activeBusiness?.name || 'our business'}. How can I assist you today?`
  );
  const [primaryColor, setPrimaryColor] = useState('#7C8363');
  const [requirePhone, setRequirePhone] = useState(true);
  const [requireRequirement, setRequireRequirement] = useState(true);

  // Live preview interactive state
  const [previewMessages, setPreviewMessages] = useState<
    { role: 'bot' | 'user'; text: string }[]
  >([
    {
      role: 'bot',
      text: `Namaste! Welcome to ${activeBusiness?.name || 'our business'}. How can I assist you today?`,
    },
  ]);
  const [previewInput, setPreviewInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const embedCode = `<!-- BharatAI Business OS Embeddable Chatbot Widget -->
<script 
  src="${window.location.origin}/public/assets/js/chat-widget.js" 
  data-business-id="${activeBusiness?.id || 1}" 
  data-color="${primaryColor}"
  async>
</script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewInput.trim()) return;

    const userText = previewInput;
    setPreviewInput('');

    setPreviewMessages((prev) => [
      ...prev,
      { role: 'user', text: userText },
    ]);

    setTimeout(() => {
      setPreviewMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: `Thank you for sharing! I've logged your request into our CRM for ${activeBusiness?.name || 'our team'}. May I also have your phone number to share our brochure?`,
        },
      ]);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-4 h-4 text-[#7C8363]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">
            Lead Capture Widget
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-[#2D2D26]">AI Website Chatbot</h1>
        <p className="text-xs text-[#8A8A7C] mt-1">
          Deploy an intelligent, 24/7 lead-generating chatbot on your website to capture high-intent inquiries and answer questions.
        </p>
      </div>

      {/* 2-Column Split: Bot Config & Live Widget Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-4 text-xs">
            <h2 className="text-base font-serif font-bold text-[#2D2D26]">Bot Appearance & Settings</h2>

            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Chatbot Display Name</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#2D2D26] mb-1">Welcome Greeting Message</label>
              <textarea
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
              />
            </div>

            <div className="pt-2 border-t border-[#E8E2D9]">
              <span className="block font-semibold text-[#2D2D26] mb-2">Automated Lead Collection Fields</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirePhone}
                    onChange={(e) => setRequirePhone(e.target.checked)}
                    className="accent-[#7C8363]"
                  />
                  <span>Collect Visitor Phone Number</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireRequirement}
                    onChange={(e) => setRequireRequirement(e.target.checked)}
                    className="accent-[#7C8363]"
                  />
                  <span>Collect Project Requirement / Budget</span>
                </label>
              </div>
            </div>
          </div>

          {/* Embed Script Box */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#7C8363]" />
                <h3 className="text-sm font-serif font-bold text-[#2D2D26]">Embed Script</h3>
              </div>
              <button
                onClick={handleCopyEmbed}
                className="px-3 py-1 rounded-full bg-[#F2F4EC] hover:bg-[#E4E8DA] text-[#555C42] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-[#7C8363]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied Script' : 'Copy HTML'}
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-[#23241F] text-[#D1C7B7] text-[11px] font-mono overflow-x-auto">
              {embedCode}
            </pre>
            <p className="text-[11px] text-[#8A8A7C]">
              Paste this snippet right before the closing <code className="text-[#7C8363] font-bold">&lt;/body&gt;</code> tag on any website, WordPress, Shopify, or Webflow store.
            </p>
          </div>
        </div>

        {/* Right: Live Interactive Widget Simulation */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col justify-between h-[520px]">
          {/* Simulated Chatbot Header */}
          <div className="p-4 rounded-2xl bg-[#7C8363] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-serif font-bold">
                भ
              </div>
              <div>
                <div className="font-semibold text-xs">{botName}</div>
                <div className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                </div>
              </div>
            </div>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Preview
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 py-4 overflow-y-auto space-y-3 text-xs">
            {previewMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-[#7C8363] text-white flex items-center justify-center text-[10px] shrink-0 font-serif font-bold">
                    भ
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-[#7C8363] text-white rounded-br-xs'
                      : 'bg-[#FAF8F5] text-[#2D2D26] border border-[#E8E2D9] rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendPreview} className="relative flex items-center pt-2">
            <input
              type="text"
              value={previewInput}
              onChange={(e) => setPreviewInput(e.target.value)}
              placeholder="Test reply as website visitor..."
              className="w-full pl-4 pr-16 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2D2D26] focus:outline-hidden focus:border-[#7C8363]"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-full bg-[#7C8363] text-white text-xs hover:bg-[#6B7154]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
