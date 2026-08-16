export interface User {
  id: number;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'BUSINESS_OWNER' | 'MANAGER' | 'STAFF' | 'AGENCY_OWNER' | 'AGENCY_STAFF';
  phone?: string;
  avatar_url?: string;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  currency?: string;
  currency_symbol?: string;
  timezone?: string;
}

export interface Lead {
  id: number;
  business_id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source_id?: number;
  source_name?: string;
  status_id?: number;
  status_name?: string;
  status_color?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_value: number;
  requirement?: string;
  location?: string;
  ai_score?: number;
  ai_intent?: string;
  ai_buying_probability?: string;
  ai_summary?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  business_id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  lifetime_value: number;
  address?: string;
  city?: string;
  state?: string;
  created_at: string;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  ai_credits_monthly: number;
  max_leads: number;
  max_team_members: number;
  features?: string[];
}

export interface Subscription {
  id: number;
  business_id: number;
  plan_name: string;
  plan_slug: string;
  status: string;
  ai_credits_limit: number;
  ai_credits_used: number;
  max_leads: number;
  leads_count: number;
  usage?: {
    ai_credits_used: number;
    ai_credits_limit: number;
    leads_count: number;
    leads_limit: number;
    team_members_limit: number;
  };
}

export interface DashboardMetrics {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  customers_count: number;
  conversion_rate: number;
  ai_credits_used: number;
  ai_credits_limit: number;
  pipeline_value: number;
  recent_leads: Lead[];
}

export type DashboardStats = DashboardMetrics;

export interface AIConversation {
  id: number;
  title: string;
  created_at: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  model_used?: string;
  created_at: string;
}

export interface KnowledgeSource {
  id: number;
  title: string;
  type: 'text' | 'faq' | 'url';
  chunk_count: number;
  raw_content?: string;
  source_url?: string;
  created_at: string;
}
