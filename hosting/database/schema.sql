-- ==============================================================================
-- BharatAI Business OS - Production Database Schema
-- Version: 1.0.0
-- Engine: MySQL 8+ / InnoDB / utf8mb4
-- Description: Multi-tenant AI business automation, CRM, knowledge base,
--              chatbot, billing, proposals, agency, and administration platform.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ------------------------------------------------------------------------------
-- 1. AUTHENTICATION & ACCESS CONTROL
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_system` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_role_perm` (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT UNSIGNED NOT NULL DEFAULT 3, -- 1: SUPER_ADMIN, 2: ADMIN, 3: BUSINESS_OWNER, 4: MANAGER, 5: STAFF, 6: AGENCY_OWNER, 7: AGENCY_STAFF
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `avatar_url` VARCHAR(255) NULL,
  `status` ENUM('active', 'inactive', 'suspended', 'pending_verification') DEFAULT 'active',
  `email_verified_at` TIMESTAMP NULL,
  `remember_token` VARCHAR(100) NULL,
  `two_factor_secret` VARCHAR(255) NULL,
  `two_factor_enabled` TINYINT(1) DEFAULT 0,
  `current_business_id` INT UNSIGNED NULL,
  `onboarding_completed` TINYINT(1) DEFAULT 0,
  `onboarding_step` INT DEFAULT 1,
  `last_login_at` TIMESTAMP NULL,
  `last_login_ip` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `designation` VARCHAR(100) NULL,
  `company_name` VARCHAR(150) NULL,
  `bio` TEXT NULL,
  `timezone` VARCHAR(50) DEFAULT 'UTC',
  `language` VARCHAR(10) DEFAULT 'en',
  `theme_preference` ENUM('light', 'dark', 'system') DEFAULT 'light',
  `notification_preferences` JSON NULL,
  `custom_fields` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(255) NULL,
  `is_successful` TINYINT(1) DEFAULT 0,
  `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_login_attempts` (`email`, `ip_address`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pwd_reset` (`email`, `token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_verifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `verified_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_email_verify` (`user_id`, `token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. MULTI-TENANT BUSINESS STRUCTURE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `businesses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `owner_user_id` INT UNSIGNED NOT NULL,
  `agency_id` INT UNSIGNED NULL, -- If managed under an agency
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(160) NOT NULL UNIQUE,
  `legal_name` VARCHAR(191) NULL,
  `business_type` VARCHAR(100) NULL,
  `industry` VARCHAR(100) NULL,
  `website` VARCHAR(255) NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `country` VARCHAR(100) DEFAULT 'India',
  `postal_code` VARCHAR(30) NULL,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `currency_symbol` VARCHAR(10) DEFAULT '₹',
  `timezone` VARCHAR(50) DEFAULT 'Asia/Kolkata',
  `about` TEXT NULL,
  `usp` TEXT NULL,
  `target_audience` TEXT NULL,
  `status` ENUM('active', 'trialing', 'suspended', 'archived') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  KEY `idx_biz_owner` (`owner_user_id`),
  KEY `idx_biz_agency` (`agency_id`),
  KEY `idx_biz_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'invited', 'suspended') DEFAULT 'active',
  `invite_token` VARCHAR(100) NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_biz_user` (`business_id`, `user_id`),
  KEY `idx_bm_business` (`business_id`),
  KEY `idx_bm_user` (`user_id`),
  CONSTRAINT `fk_bm_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL UNIQUE,
  `logo_url` VARCHAR(255) NULL,
  `favicon_url` VARCHAR(255) NULL,
  `tax_number` VARCHAR(100) NULL, -- e.g. GSTIN, VAT, EIN
  `tax_rate_default` DECIMAL(5,2) DEFAULT 18.00,
  `invoice_prefix` VARCHAR(20) DEFAULT 'INV-',
  `quote_prefix` VARCHAR(20) DEFAULT 'QUO-',
  `proposal_prefix` VARCHAR(20) DEFAULT 'PROP-',
  `smtp_host` VARCHAR(150) NULL,
  `smtp_port` INT NULL,
  `smtp_username` VARCHAR(150) NULL,
  `smtp_password` VARCHAR(255) NULL,
  `smtp_encryption` VARCHAR(10) DEFAULT 'tls',
  `smtp_from_name` VARCHAR(100) NULL,
  `smtp_from_email` VARCHAR(150) NULL,
  `ai_tone` VARCHAR(50) DEFAULT 'professional',
  `ai_primary_language` VARCHAR(50) DEFAULT 'English',
  `chatbot_enabled` TINYINT(1) DEFAULT 1,
  `notification_email` VARCHAR(150) NULL,
  `notification_sms` VARCHAR(50) NULL,
  `custom_css` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bsettings_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_hours` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `day_of_week` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  `is_closed` TINYINT(1) DEFAULT 0,
  `open_time` TIME DEFAULT '09:00:00',
  `close_time` TIME DEFAULT '18:00:00',
  UNIQUE KEY `uniq_biz_day` (`business_id`, `day_of_week`),
  CONSTRAINT `fk_bhours_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_services` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12,2) DEFAULT 0.00,
  `duration_minutes` INT DEFAULT 60,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_bserv_biz` (`business_id`),
  CONSTRAINT `fk_bserv_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `sku` VARCHAR(100) NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12,2) DEFAULT 0.00,
  `cost_price` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `stock_quantity` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_bprod_biz` (`business_id`),
  CONSTRAINT `fk_bprod_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_faqs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_bfaq_biz` (`business_id`),
  CONSTRAINT `fk_bfaq_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `business_documents` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(50) NOT NULL,
  `file_size` BIGINT UNSIGNED DEFAULT 0,
  `extracted_text` LONGTEXT NULL,
  `is_processed` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_bdoc_biz` (`business_id`),
  CONSTRAINT `fk_bdoc_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. KNOWLEDGE BASE & RAG (Retrieval-Augmented Generation)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `knowledge_sources` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `source_type` ENUM('file', 'url', 'faq', 'manual_text', 'product', 'service') NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `source_url` VARCHAR(255) NULL,
  `file_path` VARCHAR(255) NULL,
  `content_raw` LONGTEXT NULL,
  `content_length` INT UNSIGNED DEFAULT 0,
  `status` ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
  `chunk_count` INT UNSIGNED DEFAULT 0,
  `error_message` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_ksource_biz` (`business_id`),
  CONSTRAINT `fk_ksource_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `knowledge_chunks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `source_id` INT UNSIGNED NOT NULL,
  `chunk_index` INT UNSIGNED NOT NULL,
  `title` VARCHAR(191) NULL,
  `content` TEXT NOT NULL,
  `token_count` INT UNSIGNED DEFAULT 0,
  `embedding_json` JSON NULL, -- For future native vector search
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT KEY `ft_chunk_content` (`content`),
  KEY `idx_kchunk_biz` (`business_id`),
  KEY `idx_kchunk_source` (`source_id`),
  CONSTRAINT `fk_kchunk_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_kchunk_source` FOREIGN KEY (`source_id`) REFERENCES `knowledge_sources` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. AI PROVIDERS, MODELS & USAGE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ai_providers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE, -- 'gemini', 'openai', 'anthropic', 'custom'
  `name` VARCHAR(100) NOT NULL,
  `api_key_encrypted` TEXT NULL,
  `base_url` VARCHAR(255) NULL,
  `is_enabled` TINYINT(1) DEFAULT 1,
  `is_default` TINYINT(1) DEFAULT 0,
  `priority` INT DEFAULT 10,
  `settings_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_models` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `provider_id` INT UNSIGNED NOT NULL,
  `model_identifier` VARCHAR(100) NOT NULL, -- e.g. 'gemini-3.7-flash', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022'
  `display_name` VARCHAR(100) NOT NULL,
  `task_type` VARCHAR(50) DEFAULT 'general', -- 'chat', 'fast', 'reasoning', 'embedding', 'image'
  `max_tokens` INT DEFAULT 4096,
  `temperature_default` DECIMAL(3,2) DEFAULT 0.70,
  `cost_per_1k_input_tokens` DECIMAL(10,6) DEFAULT 0.000150,
  `cost_per_1k_output_tokens` DECIMAL(10,6) DEFAULT 0.000600,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_fallback` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_aimod_prov` (`provider_id`),
  CONSTRAINT `fk_aimod_prov` FOREIGN KEY (`provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_usage` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NULL,
  `provider_slug` VARCHAR(50) NOT NULL,
  `model_identifier` VARCHAR(100) NOT NULL,
  `feature` VARCHAR(100) NOT NULL, -- 'chat_assistant', 'lead_qualification', 'proposal_generation', 'quote_generation', 'seo_tool', 'social_generator', 'review_reply', 'chatbot_public'
  `prompt_tokens` INT UNSIGNED DEFAULT 0,
  `completion_tokens` INT UNSIGNED DEFAULT 0,
  `total_tokens` INT UNSIGNED DEFAULT 0,
  `estimated_cost` DECIMAL(10,6) DEFAULT 0.000000,
  `request_time_ms` INT UNSIGNED DEFAULT 0,
  `status` ENUM('success', 'failed', 'rate_limited') DEFAULT 'success',
  `error_message` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_aiusage_biz` (`business_id`),
  KEY `idx_aiusage_feature` (`feature`),
  KEY `idx_aiusage_created` (`created_at`),
  CONSTRAINT `fk_aiusage_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(191) NOT NULL DEFAULT 'New Conversation',
  `context_type` VARCHAR(50) DEFAULT 'business_assistant',
  `model_used` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  KEY `idx_aiconv_biz` (`business_id`),
  KEY `idx_aiconv_user` (`user_id`),
  CONSTRAINT `fk_aiconv_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT UNSIGNED NOT NULL,
  `role` ENUM('user', 'assistant', 'system') NOT NULL,
  `content` LONGTEXT NOT NULL,
  `tokens_used` INT UNSIGNED DEFAULT 0,
  `context_sources_json` JSON NULL, -- Citations from knowledge base
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_aimsg_conv` (`conversation_id`),
  CONSTRAINT `fk_aimsg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. PUBLIC WEBSITE AI CHATBOT & SESSIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `chat_sessions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `session_token` VARCHAR(100) NOT NULL UNIQUE,
  `visitor_ip` VARCHAR(45) NULL,
  `visitor_country` VARCHAR(100) NULL,
  `visitor_city` VARCHAR(100) NULL,
  `user_agent` VARCHAR(255) NULL,
  `referrer_url` VARCHAR(255) NULL,
  `lead_captured` TINYINT(1) DEFAULT 0,
  `message_count` INT UNSIGNED DEFAULT 0,
  `status` ENUM('active', 'ended', 'handed_off') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_csession_biz` (`business_id`),
  CONSTRAINT `fk_csession_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_leads` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `chat_session_id` INT UNSIGNED NULL,
  `name` VARCHAR(150) NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(50) NULL,
  `company` VARCHAR(150) NULL,
  `requirement` TEXT NULL,
  `budget` VARCHAR(100) NULL,
  `location` VARCHAR(150) NULL,
  `lead_id` INT UNSIGNED NULL, -- Linked lead in CRM
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_clead_biz` (`business_id`),
  CONSTRAINT `fk_clead_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. CRM (LEADS, CUSTOMERS, NOTES, ACTIVITIES, TASKS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `lead_statuses` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NULL, -- NULL = System default
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,
  `color_hex` VARCHAR(10) DEFAULT '#64748b',
  `sort_order` INT DEFAULT 0,
  `is_won` TINYINT(1) DEFAULT 0,
  `is_lost` TINYINT(1) DEFAULT 0,
  KEY `idx_lstatus_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lead_sources` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NULL,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(50) NOT NULL,
  KEY `idx_lsource_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `color_hex` VARCHAR(10) DEFAULT '#3b82f6',
  UNIQUE KEY `uniq_tag_biz_name` (`business_id`, `name`),
  CONSTRAINT `fk_tag_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `assigned_user_id` INT UNSIGNED NULL,
  `source_id` INT UNSIGNED NULL,
  `status_id` INT UNSIGNED NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(50) NULL,
  `company` VARCHAR(150) NULL,
  `title` VARCHAR(100) NULL,
  `location` VARCHAR(150) NULL,
  `requirement` TEXT NULL,
  `estimated_value` DECIMAL(12,2) DEFAULT 0.00,
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `ai_score` INT DEFAULT NULL, -- 0-100 score calculated by AI
  `ai_intent` VARCHAR(100) DEFAULT NULL,
  `ai_buying_probability` VARCHAR(50) DEFAULT NULL,
  `ai_summary` TEXT DEFAULT NULL,
  `ai_recommended_action` TEXT DEFAULT NULL,
  `ai_suggested_response` TEXT DEFAULT NULL,
  `ai_qualified_at` TIMESTAMP NULL,
  `next_followup_date` DATE NULL,
  `next_followup_time` TIME NULL,
  `custom_fields` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  KEY `idx_lead_biz` (`business_id`),
  KEY `idx_lead_status` (`status_id`),
  KEY `idx_lead_assigned` (`assigned_user_id`),
  KEY `idx_lead_email` (`email`),
  KEY `idx_lead_phone` (`phone`),
  KEY `idx_lead_created` (`created_at`),
  CONSTRAINT `fk_lead_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lead_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `lead_id` INT UNSIGNED NOT NULL,
  `tag_id` INT UNSIGNED NOT NULL,
  UNIQUE KEY `uniq_lead_tag` (`lead_id`, `tag_id`),
  CONSTRAINT `fk_lt_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lead_tag_relations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `lead_id` INT UNSIGNED NOT NULL,
  `tag_id` INT UNSIGNED NOT NULL,
  UNIQUE KEY `uniq_ltr` (`lead_id`, `tag_id`),
  CONSTRAINT `fk_ltr_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ltr_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lead_notes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `lead_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `note` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_lnote_lead` (`lead_id`),
  CONSTRAINT `fk_lnote_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lead_activities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `lead_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NULL,
  `activity_type` VARCHAR(50) NOT NULL, -- 'status_change', 'call', 'email_sent', 'ai_qualified', 'note_added', 'meeting'
  `description` TEXT NOT NULL,
  `metadata_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_lactivity_lead` (`lead_id`),
  CONSTRAINT `fk_lactivity_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `converted_from_lead_id` INT UNSIGNED NULL,
  `assigned_user_id` INT UNSIGNED NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(50) NULL,
  `company` VARCHAR(150) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(100) NULL,
  `country` VARCHAR(100) DEFAULT 'India',
  `tax_number` VARCHAR(100) NULL,
  `lifetime_value` DECIMAL(14,2) DEFAULT 0.00,
  `status` ENUM('active', 'inactive', 'churned') DEFAULT 'active',
  `custom_fields` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL,
  KEY `idx_cust_biz` (`business_id`),
  KEY `idx_cust_email` (`email`),
  CONSTRAINT `fk_cust_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_notes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `note` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_cnote_cust` (`customer_id`),
  CONSTRAINT `fk_cnote_cust` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customer_activities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NULL,
  `activity_type` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `metadata_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_cactivity_cust` (`customer_id`),
  CONSTRAINT `fk_cactivity_cust` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `creator_user_id` INT UNSIGNED NOT NULL,
  `assigned_user_id` INT UNSIGNED NULL,
  `lead_id` INT UNSIGNED NULL,
  `customer_id` INT UNSIGNED NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `status` ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  `due_date` DATE NULL,
  `due_time` TIME NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_task_biz` (`business_id`),
  KEY `idx_task_assigned` (`assigned_user_id`),
  KEY `idx_task_status` (`status`),
  CONSTRAINT `fk_task_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_tcomment_task` (`task_id`),
  CONSTRAINT `fk_tcomment_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `followups` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `lead_id` INT UNSIGNED NULL,
  `customer_id` INT UNSIGNED NULL,
  `assigned_user_id` INT UNSIGNED NULL,
  `followup_type` ENUM('call', 'email', 'whatsapp', 'meeting') DEFAULT 'call',
  `scheduled_date` DATE NOT NULL,
  `scheduled_time` TIME NULL,
  `notes` TEXT NULL,
  `status` ENUM('pending', 'completed', 'missed', 'cancelled') DEFAULT 'pending',
  `ai_suggested` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_fup_biz` (`business_id`),
  KEY `idx_fup_date` (`scheduled_date`),
  CONSTRAINT `fk_fup_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. EMAIL TEMPLATES, LOGS & AUTOMATION ENGINE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NULL, -- NULL = system global template
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` LONGTEXT NOT NULL,
  `placeholders_json` JSON NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_etpl_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `recipient_email` VARCHAR(191) NOT NULL,
  `recipient_name` VARCHAR(150) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` LONGTEXT NOT NULL,
  `status` ENUM('sent', 'failed', 'queued') DEFAULT 'sent',
  `error_message` TEXT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_elog_biz` (`business_id`),
  KEY `idx_elog_email` (`recipient_email`),
  CONSTRAINT `fk_elog_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `channel` ENUM('email', 'in_app', 'sms', 'webhook') DEFAULT 'in_app',
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('delivered', 'failed') DEFAULT 'delivered',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_notiflog_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `automation_rules` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `trigger_event` VARCHAR(100) NOT NULL, -- e.g. 'lead.created', 'lead.status_changed', 'lead.ai_qualified', 'lead.inactive_days'
  `conditions_json` JSON NULL, -- e.g. {"status": "qualified", "priority": "high"}
  `actions_json` JSON NOT NULL, -- e.g. [{"action": "send_email", "template_slug": "welcome"}, {"action": "create_task", "title": "Call Lead"}]
  `is_active` TINYINT(1) DEFAULT 1,
  `execution_count` INT UNSIGNED DEFAULT 0,
  `last_executed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_arule_biz` (`business_id`),
  CONSTRAINT `fk_arule_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `automation_runs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `rule_id` INT UNSIGNED NOT NULL,
  `trigger_event` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT UNSIGNED NOT NULL,
  `status` ENUM('success', 'failed', 'partial') DEFAULT 'success',
  `logs` TEXT NULL,
  `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_arun_biz` (`business_id`),
  CONSTRAINT `fk_arun_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_arun_rule` FOREIGN KEY (`rule_id`) REFERENCES `automation_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` LONGTEXT NOT NULL,
  `target_audience` ENUM('all_leads', 'qualified_leads', 'customers', 'custom') DEFAULT 'all_leads',
  `status` ENUM('draft', 'scheduled', 'sending', 'completed', 'paused') DEFAULT 'draft',
  `scheduled_at` TIMESTAMP NULL,
  `sent_count` INT UNSIGNED DEFAULT 0,
  `delivered_count` INT UNSIGNED DEFAULT 0,
  `failed_count` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_camp_biz` (`business_id`),
  CONSTRAINT `fk_camp_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `campaign_recipients` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL,
  `recipient_email` VARCHAR(191) NOT NULL,
  `recipient_name` VARCHAR(150) NULL,
  `lead_id` INT UNSIGNED NULL,
  `customer_id` INT UNSIGNED NULL,
  `status` ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  `sent_at` TIMESTAMP NULL,
  `error_message` VARCHAR(255) NULL,
  KEY `idx_crecip_camp` (`campaign_id`),
  CONSTRAINT `fk_crecip_camp` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. AI CONTENT TOOLS (REVIEWS, SOCIAL, SEO, DOCS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `platform` VARCHAR(50) DEFAULT 'Google',
  `reviewer_name` VARCHAR(150) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL DEFAULT 5,
  `review_text` TEXT NOT NULL,
  `review_date` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_rev_biz` (`business_id`),
  CONSTRAINT `fk_rev_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `review_replies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `review_id` INT UNSIGNED NOT NULL,
  `reply_text` TEXT NOT NULL,
  `tone` VARCHAR(50) DEFAULT 'professional',
  `is_ai_generated` TINYINT(1) DEFAULT 1,
  `status` ENUM('draft', 'published', 'saved') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_rreply_rev` (`review_id`),
  CONSTRAINT `fk_rreply_rev` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_posts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `platform` ENUM('instagram', 'facebook', 'linkedin', 'twitter', 'whatsapp') NOT NULL,
  `topic` VARCHAR(255) NOT NULL,
  `tone` VARCHAR(50) DEFAULT 'engaging',
  `content` TEXT NOT NULL,
  `hashtags` VARCHAR(255) NULL,
  `call_to_action` VARCHAR(150) NULL,
  `status` ENUM('draft', 'saved', 'scheduled', 'published') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_spost_biz` (`business_id`),
  CONSTRAINT `fk_spost_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seo_projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `target_keyword` VARCHAR(191) NOT NULL,
  `secondary_keywords` TEXT NULL,
  `search_intent` VARCHAR(50) DEFAULT 'Informational',
  `country` VARCHAR(50) DEFAULT 'India',
  `language` VARCHAR(50) DEFAULT 'English',
  `status` ENUM('draft', 'completed') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_seoproj_biz` (`business_id`),
  CONSTRAINT `fk_seoproj_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seo_keywords` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `seo_project_id` INT UNSIGNED NOT NULL,
  `keyword` VARCHAR(191) NOT NULL,
  `relevance_score` INT DEFAULT 100,
  KEY `idx_seokw_proj` (`seo_project_id`),
  CONSTRAINT `fk_seokw_proj` FOREIGN KEY (`seo_project_id`) REFERENCES `seo_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `seo_content` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `seo_project_id` INT UNSIGNED NOT NULL,
  `seo_title` VARCHAR(255) NOT NULL,
  `meta_description` TEXT NULL,
  `slug` VARCHAR(191) NULL,
  `outline_json` JSON NULL,
  `article_markdown` LONGTEXT NOT NULL,
  `faqs_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_seocont_proj` (`seo_project_id`),
  CONSTRAINT `fk_seocont_proj` FOREIGN KEY (`seo_project_id`) REFERENCES `seo_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `document_templates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NULL, -- NULL = System default
  `template_type` ENUM('proposal', 'quotation', 'invoice', 'contract', 'letter') NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `content_html` LONGTEXT NOT NULL,
  `placeholders_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_doctpl_biz` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `document_type` VARCHAR(50) DEFAULT 'general',
  `content_html` LONGTEXT NOT NULL,
  `status` ENUM('draft', 'finalized', 'sent', 'signed') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_doc_biz` (`business_id`),
  CONSTRAINT `fk_doc_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. PROPOSALS, QUOTATIONS & INVOICES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `proposals` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `lead_id` INT UNSIGNED NULL,
  `customer_id` INT UNSIGNED NULL,
  `proposal_number` VARCHAR(50) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `client_name` VARCHAR(150) NOT NULL,
  `client_email` VARCHAR(191) NULL,
  `introduction` TEXT NULL,
  `problem_statement` TEXT NULL,
  `proposed_solution` TEXT NULL,
  `scope_of_work` TEXT NULL,
  `deliverables` TEXT NULL,
  `timeline` VARCHAR(150) NULL,
  `pricing_total` DECIMAL(12,2) DEFAULT 0.00,
  `terms_conditions` TEXT NULL,
  `validity_days` INT DEFAULT 30,
  `status` ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
  `sent_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_prop_biz` (`business_id`),
  CONSTRAINT `fk_prop_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `proposal_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `proposal_id` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 1.00,
  `unit_price` DECIMAL(12,2) DEFAULT 0.00,
  `amount` DECIMAL(12,2) DEFAULT 0.00,
  KEY `idx_pitem_prop` (`proposal_id`),
  CONSTRAINT `fk_pitem_prop` FOREIGN KEY (`proposal_id`) REFERENCES `proposals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `lead_id` INT UNSIGNED NULL,
  `customer_id` INT UNSIGNED NULL,
  `quote_number` VARCHAR(50) NOT NULL,
  `client_name` VARCHAR(150) NOT NULL,
  `client_email` VARCHAR(191) NULL,
  `quote_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) DEFAULT 0.00,
  `notes` TEXT NULL,
  `terms` TEXT NULL,
  `status` ENUM('draft', 'sent', 'accepted', 'declined', 'converted_to_invoice') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_quote_biz` (`business_id`),
  CONSTRAINT `fk_quote_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `quotation_id` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 1.00,
  `unit_price` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `discount_percent` DECIMAL(5,2) DEFAULT 0.00,
  `total` DECIMAL(12,2) DEFAULT 0.00,
  KEY `idx_qitem_quote` (`quotation_id`),
  CONSTRAINT `fk_qitem_quote` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `customer_id` INT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `invoice_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) DEFAULT 0.00,
  `amount_paid` DECIMAL(12,2) DEFAULT 0.00,
  `payment_status` ENUM('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled') DEFAULT 'unpaid',
  `notes` TEXT NULL,
  `terms` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_inv_biz` (`business_id`),
  KEY `idx_inv_cust` (`customer_id`),
  CONSTRAINT `fk_inv_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT UNSIGNED NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 1.00,
  `unit_price` DECIMAL(12,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 18.00,
  `total` DECIMAL(12,2) DEFAULT 0.00,
  KEY `idx_iitem_inv` (`invoice_id`),
  CONSTRAINT `fk_iitem_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. SUBSCRIPTIONS, PLANS, USAGE LIMITS & PAYMENTS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `plans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'starter', 'growth', 'pro', 'enterprise'
  `name` VARCHAR(100) NOT NULL,
  `price_monthly` DECIMAL(10,2) DEFAULT 0.00,
  `price_yearly` DECIMAL(10,2) DEFAULT 0.00,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `ai_credits_monthly` INT UNSIGNED DEFAULT 100,
  `max_users` INT DEFAULT 1,
  `max_businesses` INT DEFAULT 1,
  `max_leads` INT DEFAULT 100,
  `max_knowledge_docs` INT DEFAULT 5,
  `max_campaigns_monthly` INT DEFAULT 2,
  `max_chatbot_sessions` INT DEFAULT 200,
  `storage_mb` INT DEFAULT 500,
  `has_api_access` TINYINT(1) DEFAULT 0,
  `has_agency_mode` TINYINT(1) DEFAULT 0,
  `is_popular` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plan_features` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `plan_id` INT UNSIGNED NOT NULL,
  `feature_text` VARCHAR(255) NOT NULL,
  `is_included` TINYINT(1) DEFAULT 1,
  `sort_order` INT DEFAULT 0,
  KEY `idx_pfeat_plan` (`plan_id`),
  CONSTRAINT `fk_pfeat_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `billing_interval` ENUM('monthly', 'yearly') DEFAULT 'monthly',
  `status` ENUM('active', 'trialing', 'past_due', 'cancelled', 'expired') DEFAULT 'active',
  `starts_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ends_at` TIMESTAMP NULL,
  `trial_ends_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `current_period_start` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `current_period_end` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_sub_biz` (`business_id`),
  KEY `idx_sub_plan` (`plan_id`),
  CONSTRAINT `fk_sub_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usage_limits` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL UNIQUE,
  `ai_credits_used` INT UNSIGNED DEFAULT 0,
  `ai_credits_limit` INT UNSIGNED DEFAULT 100,
  `leads_count` INT UNSIGNED DEFAULT 0,
  `leads_limit` INT UNSIGNED DEFAULT 100,
  `storage_used_bytes` BIGINT UNSIGNED DEFAULT 0,
  `storage_limit_bytes` BIGINT UNSIGNED DEFAULT 524288000, -- 500 MB
  `campaigns_sent_this_month` INT UNSIGNED DEFAULT 0,
  `chatbot_sessions_this_month` INT UNSIGNED DEFAULT 0,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ulimit_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed') DEFAULT 'percentage',
  `discount_value` DECIMAL(10,2) NOT NULL,
  `max_redemptions` INT DEFAULT NULL,
  `times_redeemed` INT DEFAULT 0,
  `expires_at` TIMESTAMP NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NULL,
  `invoice_id` INT UNSIGNED NULL,
  `payment_method` VARCHAR(50) DEFAULT 'razorpay', -- 'razorpay', 'stripe', 'cashfree', 'bank_transfer'
  `transaction_reference` VARCHAR(191) NOT NULL UNIQUE,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'INR',
  `status` ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  `payment_gateway_response` JSON NULL,
  `paid_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pay_biz` (`business_id`),
  CONSTRAINT `fk_pay_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `payment_id` INT UNSIGNED NULL,
  `type` ENUM('credit', 'debit') NOT NULL,
  `category` VARCHAR(50) DEFAULT 'subscription',
  `amount` DECIMAL(12,2) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_tx_biz` (`business_id`),
  CONSTRAINT `fk_tx_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. API KEYS, WEBHOOKS & INTEGRATIONS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `key_prefix` VARCHAR(16) NOT NULL,
  `key_hash` VARCHAR(255) NOT NULL UNIQUE,
  `permissions_json` JSON NULL,
  `rate_limit_per_minute` INT DEFAULT 60,
  `last_used_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_apikey_biz` (`business_id`),
  CONSTRAINT `fk_apikey_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `secret_key` VARCHAR(100) NOT NULL,
  `events_json` JSON NOT NULL, -- ['lead.created', 'payment.completed', ...]
  `is_active` TINYINT(1) DEFAULT 1,
  `failure_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_wh_biz` (`business_id`),
  CONSTRAINT `fk_wh_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `webhook_id` INT UNSIGNED NOT NULL,
  `event` VARCHAR(100) NOT NULL,
  `payload_json` JSON NOT NULL,
  `response_code` INT NULL,
  `response_body` TEXT NULL,
  `status` ENUM('success', 'failed', 'retrying') DEFAULT 'success',
  `attempt_number` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_whlog_wh` (`webhook_id`),
  CONSTRAINT `fk_whlog_wh` FOREIGN KEY (`webhook_id`) REFERENCES `webhooks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `integrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `provider` VARCHAR(50) NOT NULL, -- 'whatsapp', 'google_calendar', 'zapier', 'pabbly', 'slack'
  `credentials_encrypted` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_integ_biz` (`business_id`),
  CONSTRAINT `fk_integ_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. SYSTEM SETTINGS, AUDIT, LOGS, FILES, SUPPORT TICKETS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` LONGTEXT NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `is_public` TINYINT(1) DEFAULT 0,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_user_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_entity` VARCHAR(50) NULL,
  `target_id` INT UNSIGNED NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_adminlog_user` (`admin_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NULL,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `metadata_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_audit_biz` (`business_id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `business_id` INT UNSIGNED NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `action_url` VARCHAR(255) NULL,
  `type` VARCHAR(50) DEFAULT 'info', -- 'lead', 'payment', 'system', 'task'
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `files` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `uploaded_by_user_id` INT UNSIGNED NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `file_size` BIGINT UNSIGNED NOT NULL,
  `is_public` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_file_biz` (`business_id`),
  CONSTRAINT `fk_file_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cron_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_name` VARCHAR(100) NOT NULL,
  `status` ENUM('success', 'failed', 'running') DEFAULT 'success',
  `output` TEXT NULL,
  `execution_time_seconds` DECIMAL(8,3) DEFAULT 0.000,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_cron_job` (`job_name`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `level` ENUM('debug', 'info', 'warning', 'error', 'critical') DEFAULT 'info',
  `channel` VARCHAR(50) DEFAULT 'app',
  `message` TEXT NOT NULL,
  `context_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_syslog_level` (`level`),
  KEY `idx_syslog_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'read', 'replied') DEFAULT 'new',
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `business_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
  `subject` VARCHAR(191) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `status` ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
  `description` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_ticket_biz` (`business_id`),
  KEY `idx_ticket_user` (`user_id`),
  CONSTRAINT `fk_ticket_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_replies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `is_admin_reply` TINYINT(1) DEFAULT 0,
  `reply_text` TEXT NOT NULL,
  `attachments_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_sreply_ticket` (`ticket_id`),
  CONSTRAINT `fk_sreply_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
