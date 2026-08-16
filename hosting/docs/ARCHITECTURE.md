# BharatAI Business OS — Architecture & Engineering Specification

## 1. System Architecture Overview

BharatAI Business OS is an enterprise-grade, multi-tenant AI business automation platform built on a clean PHP 8.2+ PDO & MySQL 8+ backend paired with a reactive modern dashboard UI.

```
+-----------------------------------------------------------------------+
|                            Browser / Client                           |
|       (React 19 + Tailwind CSS + Lucide Icons + Motion Layout)         |
+-----------------------------------------------------------------------+
                                   |
                                   | HTTP / REST JSON / Cookies
                                   v
+-----------------------------------------------------------------------+
|                          Web Server Routing                           |
|         Apache (.htaccess) / Nginx / Express Dev Server Proxy         |
+-----------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
+---------------------------------+         +---------------------------------+
|       PHP Auth Middleware       |         |   PHP Multi-Tenant Middleware   |
| (Session / API Key Auth / Rate) |         | (Tenant Isolation / Roles & Perm|
+---------------------------------+         +---------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                            Service Layer                              |
|  +---------------------+  +---------------------+  +---------------+  |
|  |     AIService       |  |     CRMService      |  | KnowledgeBase |  |
|  | (Gemini/OpenAI/RAG) |  | (Leads / Customers) |  | (Chunking/Doc)|  |
|  +---------------------+  +---------------------+  +---------------+  |
|  +---------------------+  +---------------------+  +---------------+  |
|  |   BillingService    |  |     MailService     |  | Document/Auto |  |
|  | (Plans/Subs/Razor)  |  |   (SMTP Dispatch)   |  | (Quotes/Rules)|  |
|  +---------------------+  +---------------------+  +---------------+  |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          Data Access Layer                            |
|             PDO Prepared Statements (MySQL 8+ / SQLite)               |
+-----------------------------------------------------------------------+
```

## 2. Multi-Tenant Security & Isolation
- Every business tenant is logically isolated.
- Business queries strictly enforce `business_id = ?` derived directly from authenticated session membership or verified API Key tokens.
- Frontend input `business_id` parameters are never blindly trusted.
- Super Admins have cross-tenant management privileges in `/admin/*`.

## 3. AI Provider Router & RAG Engine
- Multi-provider fallback mechanism: Google Gemini -> OpenAI -> Anthropic -> Custom OpenAI Compatible.
- Automatic Knowledge Retrieval: User prompts retrieve verified context chunks from `knowledge_chunks` before generating replies.
- Pre-execution credit verification and detailed token usage logging with execution duration in milliseconds.

## 4. Production Deployment Portability
- 100% native PHP codebase compatible with cPanel shared hosting, Apache mod_rewrite, Nginx FastCGI, VPS, and AWS EC2 LAMP instances.
- Zero external build dependencies required for production PHP execution.
