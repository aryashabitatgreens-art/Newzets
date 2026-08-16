-- ==============================================================================
-- BharatAI Business OS - Seed Data / Initial Setup
-- Version: 1.0.0
-- Description: Standard roles, permissions, AI providers, models, plans,
--              lead statuses, email templates, and sample admin accounts.
-- ==============================================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `slug`, `name`, `description`, `is_system`) VALUES
(1, 'SUPER_ADMIN', 'Super Administrator', 'Full platform access and server administration', 1),
(2, 'ADMIN', 'Administrator', 'Platform operations and tenant management', 1),
(3, 'BUSINESS_OWNER', 'Business Owner', 'Full control over own business tenant and team', 1),
(4, 'MANAGER', 'Manager', 'Can manage leads, customers, team members and documents', 1),
(5, 'STAFF', 'Staff / Agent', 'Can handle assigned leads, tasks and chats', 1),
(6, 'AGENCY_OWNER', 'Agency Owner', 'Can create and switch between multiple client businesses', 1),
(7, 'AGENCY_STAFF', 'Agency Staff', 'Can operate across assigned client accounts', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Permissions
INSERT INTO `permissions` (`id`, `slug`, `name`, `category`, `description`) VALUES
(1, 'users.view', 'View Users', 'users', 'Can view team members'),
(2, 'users.create', 'Create Users', 'users', 'Can invite new team members'),
(3, 'users.edit', 'Edit Users', 'users', 'Can edit user details and roles'),
(4, 'users.delete', 'Delete Users', 'users', 'Can deactivate or remove users'),
(5, 'leads.view', 'View Leads', 'crm', 'Can view lead lists and details'),
(6, 'leads.create', 'Create Leads', 'crm', 'Can create leads manually or via imports'),
(7, 'leads.edit', 'Edit Leads', 'crm', 'Can update lead status, notes and details'),
(8, 'leads.delete', 'Delete Leads', 'crm', 'Can remove leads'),
(9, 'customers.view', 'View Customers', 'crm', 'Can view customer accounts'),
(10, 'customers.create', 'Create Customers', 'crm', 'Can add new customers'),
(11, 'customers.edit', 'Edit Customers', 'crm', 'Can update customer info and timeline'),
(12, 'customers.delete', 'Delete Customers', 'crm', 'Can delete customer records'),
(13, 'ai.use', 'Use AI Features', 'ai', 'Can run AI tools, chat and automations'),
(14, 'ai.manage', 'Manage AI Settings', 'ai', 'Can configure business AI tone and models'),
(15, 'knowledge.manage', 'Manage Knowledge Base', 'knowledge', 'Can upload docs and manage FAQs'),
(16, 'proposals.manage', 'Manage Proposals & Quotes', 'documents', 'Can create proposals, quotes and invoices'),
(17, 'billing.view', 'View Billing', 'billing', 'Can view subscriptions and invoices'),
(18, 'billing.manage', 'Manage Billing', 'billing', 'Can upgrade plans and manage payment methods'),
(19, 'settings.manage', 'Manage Settings', 'settings', 'Can update business profile and integrations'),
(20, 'reports.view', 'View Reports', 'analytics', 'Can view analytics and export data'),
(21, 'admin.access', 'Access Admin Panel', 'admin', 'Can access system admin area')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. AI Providers
INSERT INTO `ai_providers` (`id`, `slug`, `name`, `base_url`, `is_enabled`, `is_default`, `priority`, `settings_json`) VALUES
(1, 'gemini', 'Google Gemini AI', 'https://generativelanguage.googleapis.com/v1beta', 1, 1, 10, '{"api_version": "v1beta", "supports_streaming": true, "supports_vision": true}'),
(2, 'openai', 'OpenAI', 'https://api.openai.com/v1', 1, 0, 20, '{"supports_streaming": true, "supports_vision": true}'),
(3, 'anthropic', 'Anthropic Claude', 'https://api.anthropic.com/v1', 1, 0, 30, '{"version_header": "2023-06-01"}'),
(4, 'custom', 'Custom OpenAI-Compatible', 'http://localhost:11434/v1', 1, 0, 40, '{"auth_header": "Bearer"}')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. AI Models
INSERT INTO `ai_models` (`id`, `provider_id`, `model_identifier`, `display_name`, `task_type`, `max_tokens`, `temperature_default`, `cost_per_1k_input_tokens`, `cost_per_1k_output_tokens`, `is_active`, `is_fallback`) VALUES
(1, 1, 'gemini-3.7-flash', 'Gemini 3.7 Flash (Default)', 'general', 8192, 0.70, 0.000100, 0.000400, 1, 0),
(2, 1, 'gemini-3.1-pro-preview', 'Gemini 3.1 Pro (Advanced Reasoning)', 'reasoning', 8192, 0.60, 0.001250, 0.005000, 1, 0),
(3, 1, 'gemini-3.1-flash-lite', 'Gemini 3.1 Flash-Lite (Fast)', 'fast', 4096, 0.70, 0.000075, 0.000300, 1, 1),
(4, 2, 'gpt-4o-mini', 'GPT-4o Mini', 'general', 4096, 0.70, 0.000150, 0.000600, 1, 1),
(5, 2, 'gpt-4o', 'GPT-4o Omnimodal', 'reasoning', 4096, 0.70, 0.002500, 0.010000, 1, 0),
(6, 3, 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 'reasoning', 8192, 0.70, 0.003000, 0.015000, 1, 0)
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`);

-- 5. Standard Lead Statuses
INSERT INTO `lead_statuses` (`id`, `business_id`, `name`, `slug`, `color_hex`, `sort_order`, `is_won`, `is_lost`) VALUES
(1, NULL, 'New Lead', 'new', '#3b82f6', 1, 0, 0),
(2, NULL, 'Contacted', 'contacted', '#06b6d4', 2, 0, 0),
(3, NULL, 'AI Qualified', 'qualified', '#8b5cf6', 3, 0, 0),
(4, NULL, 'Proposal Sent', 'proposal_sent', '#f59e0b', 4, 0, 0),
(5, NULL, 'Negotiation', 'negotiation', '#ec4899', 5, 0, 0),
(6, NULL, 'Closed / Won', 'won', '#10b981', 6, 1, 0),
(7, NULL, 'Closed / Lost', 'lost', '#ef4444', 7, 0, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 6. Standard Lead Sources
INSERT INTO `lead_sources` (`id`, `business_id`, `name`, `slug`) VALUES
(1, NULL, 'AI Chatbot Widget', 'chatbot'),
(2, NULL, 'Website Contact Form', 'website'),
(3, NULL, 'Google Search / Ads', 'google'),
(4, NULL, 'LinkedIn Outreach', 'linkedin'),
(5, NULL, 'WhatsApp Business', 'whatsapp'),
(6, NULL, 'Client Referral', 'referral'),
(7, NULL, 'Cold Outreach / Email', 'email')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 7. Subscription Plans
INSERT INTO `plans` (`id`, `slug`, `name`, `price_monthly`, `price_yearly`, `currency`, `ai_credits_monthly`, `max_users`, `max_businesses`, `max_leads`, `max_knowledge_docs`, `max_campaigns_monthly`, `max_chatbot_sessions`, `storage_mb`, `has_api_access`, `has_agency_mode`, `is_popular`, `is_active`, `sort_order`) VALUES
(1, 'free', 'Free Starter', 0.00, 0.00, 'INR', 100, 1, 1, 100, 5, 2, 250, 500, 0, 0, 0, 1, 1),
(2, 'starter', 'Growth Pro', 1499.00, 14990.00, 'INR', 1000, 3, 1, 1000, 25, 10, 2000, 2048, 1, 0, 1, 1, 2),
(3, 'growth', 'Business Scale', 3499.00, 34990.00, 'INR', 5000, 10, 3, 5000, 100, 50, 10000, 10240, 1, 0, 0, 1, 3),
(4, 'pro', 'Agency Unlimited', 7999.00, 79990.00, 'INR', 20000, 50, 25, 50000, 500, 200, 50000, 51200, 1, 1, 0, 1, 4),
(5, 'enterprise', 'Enterprise Custom', 19999.00, 199990.00, 'INR', 100000, 200, 100, 200000, 2000, 1000, 200000, 204800, 1, 1, 0, 1, 5)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 8. Plan Features List
INSERT INTO `plan_features` (`plan_id`, `feature_text`, `is_included`, `sort_order`) VALUES
(1, '100 AI Automation Credits / Month', 1, 1),
(1, '1 Business Profile & 1 Team Member', 1, 2),
(1, 'Up to 100 Active CRM Leads', 1, 3),
(1, 'AI Website Chatbot (250 sessions/mo)', 1, 4),
(1, 'Knowledge Base (5 Documents)', 1, 5),
(1, 'Standard Quotations & Proposals', 1, 6),
(2, '1,000 AI Automation Credits / Month', 1, 1),
(2, '3 Team Members & CRM Pipeline', 1, 2),
(2, 'Up to 1,000 Active CRM Leads', 1, 3),
(2, 'AI Lead Qualification & Scoring', 1, 4),
(2, 'Embeddable Chatbot with Lead Capture', 1, 5),
(2, 'Proposals & Automated Invoice Generation', 1, 6),
(2, 'REST API & Webhooks Access', 1, 7),
(3, '5,000 AI Automation Credits / Month', 1, 1),
(3, '3 Businesses & 10 Team Members', 1, 2),
(3, '5,000 Active CRM Leads & Auto Followups', 1, 3),
(3, 'AI SEO Content & Social Media Engine', 1, 4),
(3, 'Automated Email Follow-up Workflows', 1, 5),
(3, 'Multi-user Roles & Permissions', 1, 6),
(4, '20,000 AI Automation Credits / Month', 1, 1),
(4, 'Full Agency Multi-Tenant Switching (25 Clients)', 1, 2),
(4, '50,000 CRM Leads & Custom Statuses', 1, 3),
(4, 'White-label Chatbot & Custom Domains', 1, 4),
(4, 'Dedicated AI Model Fallbacks', 1, 5),
(4, 'Priority 24/7 SLA Support', 1, 6);

-- 9. Email Templates
INSERT INTO `email_templates` (`id`, `business_id`, `name`, `slug`, `subject`, `body_html`, `category`) VALUES
(1, NULL, 'Welcome & Verify Email', 'welcome_verification', 'Welcome to BharatAI Business OS - Verify your email', '<h2>Welcome to {{app_name}}, {{user_name}}!</h2><p>Thank you for creating your account. Please click the link below to verify your email address and activate your AI business workspace:</p><p><a href="{{verification_url}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Verify Email Address</a></p><p>If you did not request this, please ignore this email.</p>', 'auth'),
(2, NULL, 'Password Reset Request', 'password_reset', 'Reset Your Password - BharatAI Business OS', '<h2>Password Reset Request</h2><p>Hello {{user_name}},</p><p>We received a request to reset your password. Click the link below to set a new password:</p><p><a href="{{reset_url}}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p><p>This link will expire in 60 minutes.</p>', 'auth'),
(3, NULL, 'New Lead Welcome & Follow-up', 'lead_welcome', 'Thank you for reaching out to {{business_name}}', '<p>Hello {{lead_name}},</p><p>Thank you for contacting <strong>{{business_name}}</strong>! We have received your inquiry regarding <em>{{requirement}}</em>.</p><p>One of our team members is reviewing your request and will reach out to you shortly.</p><p>Best regards,<br><strong>{{business_name}} Team</strong></p>', 'crm'),
(4, NULL, 'Proposal Sent Notification', 'proposal_sent', 'New Business Proposal from {{business_name}} - {{proposal_number}}', '<p>Dear {{client_name}},</p><p>We have prepared a comprehensive proposal for your project: <strong>{{proposal_title}}</strong>.</p><p>Total Value: <strong>{{currency}} {{pricing_total}}</strong></p><p>You can view the full scope and deliverables in the attached proposal.</p><p>Best regards,<br>{{business_name}}</p>', 'documents'),
(5, NULL, 'Invoice Generated Notification', 'invoice_generated', 'Invoice {{invoice_number}} from {{business_name}}', '<p>Dear {{client_name}},</p><p>Please find attached invoice <strong>{{invoice_number}}</strong> for the amount of <strong>{{currency}} {{total_amount}}</strong>, due on <strong>{{due_date}}</strong>.</p><p>Thank you for your business!</p><p>Sincerely,<br>{{business_name}}</p>', 'billing')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 10. Default System Settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `category`, `is_public`) VALUES
('app_name', 'BharatAI Business OS', 'general', 1),
('app_url', 'http://localhost:3000', 'general', 1),
('company_email', 'support@bharatai.com', 'general', 1),
('currency_default', 'INR', 'general', 1),
('currency_symbol_default', '₹', 'general', 1),
('ai_default_provider', 'gemini', 'ai', 0),
('ai_default_model', 'gemini-3.7-flash', 'ai', 0),
('ai_fallback_provider', 'openai', 'ai', 0),
('ai_fallback_model', 'gpt-4o-mini', 'ai', 0),
('ai_max_tokens', '4096', 'ai', 0),
('ai_temperature', '0.7', 'ai', 0),
('smtp_host', 'smtp.mailtrap.io', 'email', 0),
('smtp_port', '2525', 'email', 0),
('smtp_username', '', 'email', 0),
('smtp_password', '', 'email', 0),
('smtp_encryption', 'tls', 'email', 0),
('smtp_from_name', 'BharatAI Business OS', 'email', 0),
('smtp_from_email', 'noreply@bharatai.com', 'email', 0),
('registration_enabled', '1', 'auth', 1),
('require_email_verification', '0', 'auth', 0),
('payment_gateway_default', 'razorpay', 'billing', 0),
('maintenance_mode', '0', 'system', 1)
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);

-- 11. Initial Admin & Demo Accounts (passwords hashed with standard BCRYPT: password_hash('Admin@123456', PASSWORD_BCRYPT))
-- Super Admin: admin@bharatai.com / Admin@123456
-- Business Demo: demo@bharatai.com / Demo@123456
INSERT INTO `users` (`id`, `email`, `password_hash`, `role_id`, `full_name`, `phone`, `status`, `email_verified_at`, `current_business_id`, `onboarding_completed`, `onboarding_step`) VALUES
(1, 'admin@bharatai.com', '$2y$12$i38E6Z41QY0eN9H5a0rYgO7V7o6k/y34P1m5j.F3vL8A9eD2zZJ6W', 1, 'Super Administrator', '+91 9876543210', 'active', NOW(), 1, 1, 7),
(2, 'demo@bharatai.com', '$2y$12$i38E6Z41QY0eN9H5a0rYgO7V7o6k/y34P1m5j.F3vL8A9eD2zZJ6W', 3, 'Vikram Sharma', '+91 9811223344', 'active', NOW(), 1, 1, 7)
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);

INSERT INTO `user_profiles` (`id`, `user_id`, `designation`, `company_name`, `timezone`, `language`, `theme_preference`) VALUES
(1, 1, 'Chief Executive Officer', 'BharatAI Corp', 'Asia/Kolkata', 'en', 'light'),
(2, 2, 'Founder & Director', 'Bharat Automation Labs', 'Asia/Kolkata', 'en', 'light')
ON DUPLICATE KEY UPDATE `company_name`=VALUES(`company_name`);

-- Demo Business
INSERT INTO `businesses` (`id`, `owner_user_id`, `name`, `slug`, `legal_name`, `business_type`, `industry`, `website`, `phone`, `email`, `address`, `city`, `state`, `country`, `currency`, `currency_symbol`, `timezone`, `about`, `usp`, `target_audience`, `status`) VALUES
(1, 2, 'Bharat Automation Labs', 'bharat-automation-labs', 'Bharat Automation Private Limited', 'Agency / Tech Services', 'Information Technology', 'https://bharatai.example.com', '+91 9811223344', 'contact@bharatlabs.example.com', 'Suite 402, Cyber Tower, Sector 62', 'Noida', 'Uttar Pradesh', 'India', 'INR', '₹', 'Asia/Kolkata', 'We deliver AI-driven workflow automations, custom ERP integrations, and intelligent chatbots for growing Indian businesses.', 'Zero-latency multilingual AI chatbots and end-to-end CRM automation with WhatsApp integration.', 'SMEs, D2C brands, educational institutes and high-growth service firms in India.', 'active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `business_members` (`id`, `business_id`, `user_id`, `role_id`, `status`) VALUES
(1, 1, 1, 1, 'active'),
(2, 1, 2, 3, 'active')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `business_settings` (`id`, `business_id`, `tax_number`, `tax_rate_default`, `invoice_prefix`, `quote_prefix`, `proposal_prefix`, `ai_tone`, `ai_primary_language`, `chatbot_enabled`) VALUES
(1, 1, '07AAAAA0000A1Z5', 18.00, 'INV-2026-', 'QUO-2026-', 'PROP-2026-', 'professional', 'English', 1)
ON DUPLICATE KEY UPDATE `tax_number`=VALUES(`tax_number`);

INSERT INTO `subscriptions` (`id`, `business_id`, `plan_id`, `billing_interval`, `status`, `starts_at`, `current_period_start`, `current_period_end`) VALUES
(1, 1, 3, 'monthly', 'active', NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

INSERT INTO `usage_limits` (`id`, `business_id`, `ai_credits_used`, `ai_credits_limit`, `leads_count`, `leads_limit`, `storage_used_bytes`, `storage_limit_bytes`, `period_start`, `period_end`) VALUES
(1, 1, 42, 5000, 15, 5000, 10485760, 10737418240, CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY))
ON DUPLICATE KEY UPDATE `ai_credits_limit`=VALUES(`ai_credits_limit`);

-- Demo FAQs & Knowledge
INSERT INTO `business_faqs` (`business_id`, `category`, `question`, `answer`, `sort_order`) VALUES
(1, 'Services', 'What automation services do you provide?', 'We specialize in WhatsApp bot automation, AI customer support routing, lead qualification workflows, invoice reconciliation, and CRM data synchronization.', 1),
(1, 'Pricing', 'How does your subscription model work?', 'We offer fixed monthly subscriptions with dedicated credits for AI generation, lead volume scaling, and ongoing workflow maintenance.', 2),
(1, 'Support', 'What are your operational support hours?', 'Our support team is available Monday through Saturday from 9:00 AM to 7:00 PM IST with 24/7 automated bot triage.', 3);

INSERT INTO `business_services` (`business_id`, `name`, `category`, `description`, `price`, `duration_minutes`) VALUES
(1, 'AI Chatbot Deployment & Training', 'AI Implementation', 'Custom multi-language bot trained on your product docs and catalogs with WhatsApp / Web integration.', 24999.00, 120),
(1, 'CRM & Lead Automation Pipeline', 'Workflow Automation', 'Automated lead capture, instant AI qualification scoring, and salesperson calendar routing.', 18999.00, 90),
(1, 'Monthly Retainer & System Maintenance', 'Support', 'Ongoing AI prompt tuning, credit allocation management, and workflow updates.', 9999.00, 60);

INSERT INTO `business_products` (`business_id`, `sku`, `name`, `category`, `description`, `price`, `tax_rate`, `stock_quantity`) VALUES
(1, 'BOT-STARTER', 'BharatAI Web Widget License (Annual)', 'Software', 'Standalone embed widget license for 1 domain with unlimited user interactions.', 12000.00, 18.00, 999),
(1, 'BOT-WHATSAPP', 'WhatsApp Cloud API AI Connector', 'Plugin', 'Official Meta Cloud API webhook bridge for 2-way AI conversational commerce.', 15000.00, 18.00, 500);

-- Demo Knowledge Sources & Chunks for RAG
INSERT INTO `knowledge_sources` (`id`, `business_id`, `source_type`, `title`, `content_raw`, `content_length`, `status`, `chunk_count`) VALUES
(1, 1, 'manual_text', 'Company Profile & Service Catalog', 'Bharat Automation Labs is an enterprise AI automation studio based in Noida, India. We build AI chatbots, automated CRM pipelines, smart invoicing, and review management software. Our primary contact is contact@bharatlabs.example.com or +91 9811223344. We provide 30-day money-back satisfaction guarantees on all implementation contracts.', 410, 'processed', 2);

INSERT INTO `knowledge_chunks` (`id`, `business_id`, `source_id`, `chunk_index`, `title`, `content`, `token_count`) VALUES
(1, 1, 1, 1, 'Company Profile', 'Bharat Automation Labs is an enterprise AI automation studio based in Noida, India. We build AI chatbots, automated CRM pipelines, smart invoicing, and review management software.', 35),
(2, 1, 1, 2, 'Contact & Policies', 'Our primary contact is contact@bharatlabs.example.com or +91 9811223344. We provide 30-day money-back satisfaction guarantees on all implementation contracts.', 28);
