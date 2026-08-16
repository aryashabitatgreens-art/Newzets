# BharatAI Business OS - Hosting & Deployment Package (PHP + MySQL)

यह फोल्डर (`/hosting`) पूरा का पूरा **cPanel, Shared Hosting, Apache, VPS, AWS EC2, या Hostinger** पर डिप्लॉय करने के लिए तैयार किया गया है।

This folder is a standalone, production-ready package containing the native PHP 8.2+ backend, MySQL 8+ database schema, REST API endpoints, autonomous AI services (Gemini, OpenAI, Claude), and automation crons.

---

## 📁 फोल्डर स्ट्रक्चर (Folder Structure)

```text
/hosting
  ├── .env.example              <- Database aur API keys ka configuration template
  ├── .htaccess                 <- Apache rewrite rules aur security protection
  ├── config.php                <- Core bootstrap aur service loader
  ├── index.php                 <- Entry point aur API status router
  ├── README.md                 <- यह गाइड (Hosting Instructions)
  ├── /app                      <- Core PHP Application
  │    ├── /config              <- Database PDO configuration
  │    ├── /helpers             <- Utility functions aur sanitization
  │    ├── /middleware          <- Authentication & multi-tenant permission guards
  │    └── /services            <- AI Service, CRM, Billing, Knowledge RAG, Emails
  ├── /api                      <- REST PHP API Endpoints
  │    ├── /auth                <- Login, Register, Logout, Onboarding
  │    ├── /leads               <- Leads CRUD, AI Qualification
  │    ├── /customers           <- Customer dossiers, conversions
  │    ├── /ai                  <- ChatGPT-style Assistant, Tool Generators
  │    ├── /knowledge           <- Knowledge Base RAG documents
  │    ├── /chat                <- Website embeddable chatbot
  │    ├── /billing             <- Subscriptions & quota limits
  │    └── /admin               <- Multi-tenant overview & system health
  ├── /cron                     <- Automation crons (run_automations.php)
  ├── /database                 <- MySQL Schema (schema.sql) aur demo seed (seed_demo.sql)
  ├── /docs                     <- Deployment & Architecture guides
  ├── /public                   <- Public assets & uploads folder
  └── /storage                  <- Logs, cache, and session files
```

---

## 🚀 cPanel / Shared Hosting पर 5 मिनट में सेटअप कैसे करें (Step-by-Step)

### Step 1: MySQL Database बनाएं (Create MySQL Database)
1. अपने **cPanel** में लॉगिन करें और **MySQL Database Wizard** खोलें।
2. एक नया डेटाबेस बनाएं (उदा: `user_bharataidb`)।
3. एक नया डेटाबेस यूजर बनाएं और मजबूत पासवर्ड सेट करें।
4. यूजर को डेटाबेस के **ALL PRIVILEGES** प्रदान करें।

### Step 2: Database Schema Import करें (Import schema.sql)
1. cPanel में **phpMyAdmin** खोलें।
2. अपने बनाए गए डेटाबेस को चुनें।
3. **Import** टैब पर क्लिक करें।
4. `database/schema.sql` फाइल को सेलेक्ट करें और **Go / Import** पर क्लिक करें।
   *(वैकल्पिक: डेमो डेटा के लिए `database/seed_demo.sql` भी इम्पोर्ट कर सकते हैं)*।

### Step 3: Files Upload करें (Upload Hosting Folder Files)
1. cPanel **File Manager** में जाएं।
2. अपने डोमेन के रूट फोल्डर (`public_html` या सबडोमेन फोल्डर) में जाएं।
3. इस `/hosting` फोल्डर की सभी फाइलों और सब-फोल्डर्स को सीधे वहां अपलोड करें या zip बनाकर extract करें।

### Step 4: .env File Configure करें
1. File Manager में `.env.example` को रीनेम करके `.env` बनाएं (या कॉपी करें)।
2. `.env` में अपने MySQL क्रेडेंशियल्स और Gemini API Key दर्ज करें:
```env
APP_NAME="BharatAI Business OS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_cpanel_dbname
DB_USER=your_cpanel_dbuser
DB_PASSWORD=your_mysql_password

GEMINI_API_KEY=your_google_gemini_api_key_here
```

### Step 5: Crontab Job सेट करें (Automations & Follow-ups)
1. cPanel में **Cron Jobs** सेक्शन खोलें।
2. हर 5 मिनट के लिए शेड्यूल सेट करें (`*/5 * * * *`):
```bash
php /home/YOUR_CPANEL_USER/public_html/cron/run_automations.php
```

---

## 🔒 Security Features Included
- **Prepared Statements (PDO)**: Full SQL Injection protection.
- **Tenant Isolation**: `business_id` server-side enforcement.
- **Execution Blocker**: Direct PHP execution blocked inside uploads.
- **Multi-AI Fallback**: Google Gemini, OpenAI, and Anthropic router.
