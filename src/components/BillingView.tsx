import React, { useState, useEffect } from 'react';
import { Plan, Subscription, Business } from '../types';
import { api } from '../services/api';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Layers, 
  RefreshCw,
  Tag
} from 'lucide-react';

interface BillingViewProps {
  subscription: Subscription | null;
  activeBusiness: Business | null;
  onRefreshAuth: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  subscription,
  activeBusiness,
  onRefreshAuth,
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [upgradingId, setUpgradingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currencySymbol = activeBusiness?.currency_symbol || '₹';

  const loadBilling = async () => {
    try {
      setLoading(true);
      const data = await api.getBillingData();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Failed to load billing plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleUpgrade = async (planId: number) => {
    try {
      setUpgradingId(planId);
      await api.upgradePlan(planId, billingCycle, couponCode || undefined);
      setStatusMessage({ text: 'Plan updated successfully! Your limits have refreshed.', type: 'success' });
      onRefreshAuth();
      loadBilling();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Upgrade failed', type: 'error' });
    } finally {
      setUpgradingId(null);
    }
  };

  const currentPlanSlug = subscription?.plan_slug || 'free';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#7C8363]"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C8363]">
              Subscription & Quotas
            </span>
          </div>
          <h1 className="text-3xl font-serif text-[#2D2D26]">Plans & Business Subscriptions</h1>
          <p className="text-xs text-[#8A8A7C] mt-1">
            Scale your business automation with autonomous AI credits, multi-seat teams, and CRM capacity.
          </p>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center p-1 rounded-full bg-[#F2EDE4] border border-[#E8E2D9] self-start md:self-auto">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-[#2D2D26] shadow-sm'
                : 'text-[#8A8A7C] hover:text-[#2D2D26]'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-white text-[#2D2D26] shadow-sm'
                : 'text-[#8A8A7C] hover:text-[#2D2D26]'
            }`}
          >
            <span>Yearly Billing</span>
            <span className="text-[9px] bg-[#FAF5EC] text-[#C9A66B] border border-[#EADBCE] px-1.5 py-0.5 rounded-full font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
          statusMessage.type === 'success' ? 'bg-[#F2F4EC] text-[#555C42] border-[#D5DAC7]' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {/* Current Quota Status */}
      {subscription && (
        <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[#E8E2D9] shadow-xs">
          <h2 className="text-sm font-serif font-bold text-[#2D2D26] mb-4">
            Active Subscription: <span className="text-[#7C8363] uppercase tracking-wide">{subscription.plan_name}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9]">
              <span className="text-[#8A8A7C] text-[10px] uppercase font-bold block mb-1">AI Credits Quota</span>
              <div className="text-xl font-serif font-bold text-[#2D2D26]">
                {subscription.usage?.ai_credits_used ?? 0} / {subscription.usage?.ai_credits_limit ?? 150}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9]">
              <span className="text-[#8A8A7C] text-[10px] uppercase font-bold block mb-1">CRM Leads Stored</span>
              <div className="text-xl font-serif font-bold text-[#2D2D26]">
                {subscription.usage?.leads_count ?? 0} / {subscription.usage?.leads_limit ?? 50}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8E2D9]">
              <span className="text-[#8A8A7C] text-[10px] uppercase font-bold block mb-1">Team Seats</span>
              <div className="text-xl font-serif font-bold text-[#2D2D26]">
                {subscription.usage?.team_members_limit ?? 1} Max Members
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlanSlug === plan.slug;
          const isPopular = plan.slug === 'growth';
          const price = billingCycle === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12);

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 border flex flex-col justify-between transition-all relative ${
                isPopular
                  ? 'border-[#7C8363] shadow-lg shadow-[#7C8363]/10 ring-2 ring-[#7C8363]/20'
                  : 'border-[#E8E2D9] hover:border-[#D5CDC0]'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#7C8363] text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-serif font-bold text-[#2D2D26]">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-serif font-bold text-[#2D2D26]">
                    {price === 0 ? 'Free' : `${currencySymbol} ${price.toLocaleString()}`}
                  </span>
                  {price > 0 && <span className="text-[10px] text-[#8A8A7C]">/mo</span>}
                </div>

                <div className="mt-6 space-y-2.5 text-xs text-[#4A4A40]">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C8363] shrink-0" />
                    <span><strong>{plan.ai_credits_monthly.toLocaleString()}</strong> AI Credits/mo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C8363] shrink-0" />
                    <span><strong>{plan.max_leads.toLocaleString()}</strong> Leads CRM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C8363] shrink-0" />
                    <span><strong>{plan.max_team_members}</strong> Team Member(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7C8363] shrink-0" />
                    <span>Web Chatbot Widget</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E8E2D9]">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-full bg-[#F2F4EC] text-[#7C8363] text-xs font-bold uppercase tracking-wider border border-[#D5DAC7]"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgradingId === plan.id}
                    className="w-full py-2.5 rounded-full bg-[#7C8363] hover:bg-[#6B7154] text-white text-xs font-medium shadow-md shadow-[#7C8363]/20 transition-all"
                  >
                    {upgradingId === plan.id ? 'Activating...' : 'Select Plan'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
