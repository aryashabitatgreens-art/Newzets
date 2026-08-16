# cPanel Deployment Guide for BharatAI Business OS

Follow this step-by-step procedure to deploy BharatAI Business OS on any cPanel / Apache Shared or VPS Hosting.

## Prerequisites
- cPanel account with MySQL Database Wizard & File Manager or SSH access.
- PHP 8.2 or higher enabled in **MultiPHP Manager** or **Select PHP Version**.
- PHP Extensions: `pdo`, `pdo_mysql`, `curl`, `mbstring`, `openssl`, `json`, `fileinfo`.

---

## 1. Create MySQL Database & User
1. Log into your cPanel dashboard.
2. Open **MySQL Database Wizard**.
3. Create database: `youruser_bharatai`.
4. Create user: `youruser_dbuser` with a strong password.
5. Grant **ALL PRIVILEGES** to the user on this database.

---

## 2. Import Database Schema
1. Open **phpMyAdmin** from cPanel.
2. Select your newly created database `youruser_bharatai`.
3. Click the **Import** tab.
4. Upload `/database/schema.sql` and click **Go**.
5. (Optional for initial demo data): Upload `/database/seed_demo.sql` and import.

---

## 3. Upload Project Files
1. Zip the project files (or upload via FTP/SSH).
2. Extract the files into your domain's document root (e.g. `/public_html` or `/public_html/app`).
3. Ensure `.htaccess` file is present in the root folder.

---

## 4. Configure Environment Variables
1. Rename `.env.example` to `.env` in the project root.
2. Edit `.env` with your production values:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
APP_KEY=base64_bharatai_production_secret_key_849204820942048209

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=youruser_bharatai
DB_USER=youruser_dbuser
DB_PASSWORD=YourStrongDatabasePassword123!

GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
OPENAI_API_KEY=sk-YourOpenAiKeyHere
```

---

## 5. Configure Folder Permissions
Ensure the following directories have write permissions (`0775` or `0755`):
- `/storage`
- `/storage/logs`
- `/storage/documents`
- `/public/uploads`

---

## 6. Configure Automated Cron Jobs
In cPanel > **Cron Jobs**, set up a cron job to run every 5 minutes:
```bash
*/5 * * * * php /home/youruser/public_html/cron/run_automations.php secret=bharatai_cron_secret_772038102 >/dev/null 2>&1
```

---

## 7. Verify Deployment & Login
Visit `https://yourdomain.com` in your browser.
Default Super Admin Credentials (from seed):
- **Email:** `admin@bharatai.com`
- **Password:** `Admin@123456`
