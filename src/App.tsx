/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Business, Subscription } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { CustomersView } from './components/CustomersView';
import { AIAssistantView } from './components/AIAssistantView';
import { AIToolSuiteView } from './components/AIToolSuiteView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { ChatbotView } from './components/ChatbotView';
import { BillingView } from './components/BillingView';
import { AdminView } from './components/AdminView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const initAuth = async () => {
    try {
      setInitialLoading(true);
      const res = await api.checkAuth();
      if (res.authenticated && res.user) {
        setUser(res.user);
        setBusinesses(res.businesses || []);
        setActiveBusiness(res.active_business || res.businesses?.[0] || null);
        setSubscription(res.subscription || null);
      } else {
        // Fallback default demo account session
        setUser({
          id: 1,
          name: 'Ramesh Sharma',
          email: 'ramesh@bharatai.in',
          role: 'BUSINESS_OWNER',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        });
        const defaultBiz: Business = {
          id: 1,
          name: 'Bharat Automation Agency',
          slug: 'bharat-automation',
          industry: 'AI & Software Agency',
          currency: 'INR',
          currency_symbol: '₹',
        };
        setBusinesses([defaultBiz]);
        setActiveBusiness(defaultBiz);
        setSubscription({
          id: 1,
          business_id: 1,
          plan_name: 'Growth',
          plan_slug: 'growth',
          status: 'active',
          ai_credits_limit: 5000,
          ai_credits_used: 1240,
          max_leads: 500,
          leads_count: 32,
          usage: {
            ai_credits_used: 1240,
            ai_credits_limit: 5000,
            leads_count: 32,
            leads_limit: 500,
            team_members_limit: 5,
          },
        });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleSwitchBusiness = async (bizId: number) => {
    try {
      await api.switchBusiness(bizId);
      const matched = businesses.find((b) => b.id === bizId);
      if (matched) setActiveBusiness(matched);
    } catch (err) {
      console.error('Failed to switch business:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      setAuthModalOpen(true);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleAuthSuccess = (data: any) => {
    if (data.user) setUser(data.user);
    if (data.businesses) setBusinesses(data.businesses);
    if (data.active_business) setActiveBusiness(data.active_business);
    if (data.subscription) setSubscription(data.subscription);
  };

  if (initialLoading) {
    return (
      <div className="h-screen w-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-[#2D2D26]">
        <div className="w-12 h-12 rounded-2xl bg-[#7C8363] text-white flex items-center justify-center font-serif text-2xl font-bold mb-4 shadow-lg shadow-[#7C8363]/25 animate-pulse">
          भ
        </div>
        <div className="text-sm font-serif font-semibold text-[#2D2D26]">BharatAI Business OS</div>
        <p className="text-xs text-[#8A8A7C] mt-1">Initializing multi-tenant workspaces...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#FDFBF7] text-[#4A4A40] flex flex-col overflow-hidden font-sans selection:bg-[#7C8363]/20 selection:text-[#2D2D26]">
      {/* Top Header Navbar */}
      <Navbar
        user={user}
        businesses={businesses}
        activeBusiness={activeBusiness}
        subscription={subscription}
        onSwitchBusiness={handleSwitchBusiness}
        onOpenBilling={() => setActiveTab('billing')}
        onOpenSettings={() => setActiveTab('settings')}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={user?.role || 'BUSINESS_OWNER'}
        />

        {/* Dynamic Main Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FDFBF7]">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                activeBusiness={activeBusiness}
                subscription={subscription}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'leads' && (
              <LeadsView
                activeBusiness={activeBusiness}
                onLeadUpdated={initAuth}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView activeBusiness={activeBusiness} />
            )}

            {activeTab === 'ai-assistant' && (
              <AIAssistantView activeBusiness={activeBusiness} />
            )}

            {activeTab === 'ai-tools' && (
              <AIToolSuiteView activeBusiness={activeBusiness} />
            )}

            {activeTab === 'knowledge' && (
              <KnowledgeBaseView activeBusiness={activeBusiness} />
            )}

            {activeTab === 'chatbot' && (
              <ChatbotView activeBusiness={activeBusiness} />
            )}

            {activeTab === 'billing' && (
              <BillingView
                subscription={subscription}
                activeBusiness={activeBusiness}
                onRefreshAuth={initAuth}
              />
            )}

            {activeTab === 'admin' && <AdminView />}

            {activeTab === 'settings' && (
              <SettingsView
                activeBusiness={activeBusiness}
                onBusinessUpdated={initAuth}
              />
            )}
          </div>
        </main>
      </div>

      {/* Authentication & Onboarding Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
