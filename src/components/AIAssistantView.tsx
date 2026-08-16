import React, { useState, useEffect, useRef } from 'react';
import { Business, AIConversation, AIMessage } from '../types';
import { api } from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Plus, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  MessageSquare,
  Building2,
  Database,
  Leaf
} from 'lucide-react';

interface AIAssistantViewProps {
  activeBusiness: Business | null;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ activeBusiness }) => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | undefined>();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { title: 'Summarize Leads', prompt: 'Summarize today’s leads and recommend which high-intent prospects our sales team should call first.' },
    { title: 'Draft Quotation', prompt: 'Draft a professional service quotation for a standard web automation package with pricing and scope.' },
    { title: 'Follow-up Email', prompt: 'Write a persuasive follow-up email for a client who received our proposal 3 days ago but hasn’t responded.' },
    { title: 'Promotional Post', prompt: 'Generate an engaging LinkedIn post highlighting how AI automation saves small businesses 20+ hours every week.' },
  ];

  const loadConversations = async () => {
    try {
      const convs = await api.getAIConversations();
      setConversations(convs || []);
      if (convs && convs.length > 0 && !activeConvId) {
        selectConversation(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const selectConversation = async (id: number) => {
    setActiveConvId(id);
    try {
      setLoading(true);
      const msgs = await api.getAIMessages(id);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userMessage = inputPrompt.trim();
    setInputPrompt('');

    // Append user message locally
    const updatedMessages: AIMessage[] = [
      ...messages,
      { role: 'user', content: userMessage, created_at: new Date().toISOString() },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await api.sendAIMessage(userMessage, activeConvId);
      if (res.conversation_id && res.conversation_id !== activeConvId) {
        setActiveConvId(res.conversation_id);
        loadConversations();
      }

      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: res.message,
          tokens_used: res.tokens_used,
          model_used: res.model,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message || 'Unable to connect to AI provider. Please verify API configuration in Settings.'}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(undefined);
    setMessages([]);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4">
      {/* Left Chat Sessions Drawer */}
      <div className="w-full md:w-64 bg-white rounded-3xl border border-[#E8E2D9] p-4 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-full bg-[#7C8363] text-white text-xs font-medium hover:bg-[#6B7154] flex items-center justify-center gap-2 shadow-md shadow-[#7C8363]/20 transition-all mb-4"
          >
            <Plus className="w-4 h-4" /> New Conversation
          </button>

          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8A8A7C] px-2 mb-2">
            History & Sessions
          </div>

          <div className="space-y-1 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-xs text-[#8A8A7C] p-3 text-center">
                No past sessions
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all truncate ${
                    activeConvId === c.id
                      ? 'bg-[#F2F4EC] text-[#555C42] font-semibold border border-[#D5DAC7]'
                      : 'text-[#4A4A40] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-[#7C8363]" />
                  <span className="truncate">{c.title || 'Business Conversation'}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Business Context Status */}
        <div className="pt-3 border-t border-[#E8E2D9] text-xs">
          <div className="flex items-center gap-2 text-[#7C8363] font-medium text-[11px]">
            <Database className="w-3.5 h-3.5" />
            <span>RAG Context: {activeBusiness?.name || 'Active'}</span>
          </div>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 bg-white rounded-3xl border border-[#E8E2D9] flex flex-col justify-between shadow-xs overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-[#F2F4EC] text-[#7C8363] flex items-center justify-center mb-4 border border-[#D5DAC7] shadow-sm">
                <Bot className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#2D2D26]">
                {activeBusiness?.name || 'BharatAI'} Assistant
              </h2>
              <p className="text-xs text-[#8A8A7C] mt-2 mb-8 leading-relaxed">
                Powered by Google Gemini and real-time knowledge base context. Ask for proposal drafts, lead qualification strategy, customer emails, or business analysis.
              </p>

              {/* Suggested Quick Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputPrompt(qp.prompt);
                    }}
                    className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] hover:border-[#7C8363] hover:bg-[#F2F4EC]/50 text-left transition-all group"
                  >
                    <div className="text-xs font-serif font-bold text-[#2D2D26] group-hover:text-[#7C8363]">
                      {qp.title}
                    </div>
                    <div className="text-[11px] text-[#8A8A7C] line-clamp-2 mt-1">
                      {qp.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#7C8363] text-white flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                    भ
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-3xl p-5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#7C8363] text-white rounded-br-xs shadow-sm'
                      : 'bg-[#FAF8F5] text-[#2D2D26] border border-[#E8E2D9] rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2.5 border-t border-[#E8E2D9]/60 flex items-center justify-between text-[10px] text-[#8A8A7C]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C9A66B]" />
                        {msg.model_used || 'Gemini 2.5'} • {msg.tokens_used ?? 120} tokens
                      </span>

                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="flex items-center gap-1 hover:text-[#2D2D26] transition-colors"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-[#7C8363]" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#FAF5EC] border border-[#EADBCE] text-[#C9A66B] flex items-center justify-center shrink-0 font-bold text-xs">
                    U
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#7C8363] text-white flex items-center justify-center shrink-0 text-xs">
                भ
              </div>
              <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-3xl p-4 flex items-center gap-2 text-xs text-[#8A8A7C]">
                <Sparkles className="w-4 h-4 text-[#7C8363] animate-spin" />
                Thinking with business knowledge base...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E8E2D9]">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about your business, draft a document, or analyze leads..."
              className="w-full pl-5 pr-28 py-3.5 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#2D2D26] placeholder-[#8A8A7C] focus:outline-hidden focus:border-[#7C8363] focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="absolute right-2 px-5 py-2 rounded-full bg-[#7C8363] text-white text-xs font-medium hover:bg-[#6B7154] disabled:opacity-40 disabled:hover:bg-[#7C8363] flex items-center gap-1.5 shadow-md shadow-[#7C8363]/20 transition-all"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
