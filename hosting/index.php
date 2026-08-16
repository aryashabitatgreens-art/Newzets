<?php
/**
 * BharatAI Business OS - Web Entry Point & Router
 *
 * @package BharatAI
 * @version 1.0.0
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Simple API status probe
if ($requestUri === '/health' || $requestUri === '/api/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'online',
        'application' => APP_NAME,
        'version' => '1.0.0',
        'environment' => APP_ENV,
        'php_version' => PHP_VERSION,
        'gemini_configured' => !empty(env('GEMINI_API_KEY')),
        'database' => env('DB_CONNECTION', 'mysql'),
        'timestamp' => date('c')
    ]);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BharatAI Business OS - Autonomous Business Automation</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #FDFBF7;
            color: #2D2D26;
        }
        .font-serif {
            font-family: 'Newsreader', Georgia, serif;
        }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between">
    <!-- Header -->
    <header class="border-b border-[#E8E2D9] bg-[#FDFBF7]/90 backdrop-blur sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#7C8363] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    B
                </div>
                <div>
                    <h1 class="font-serif text-2xl font-bold tracking-tight text-[#2D2D26]">BharatAI</h1>
                    <p class="text-xs text-[#8A8A7C] font-medium tracking-wide uppercase">Business OS & Automation SaaS</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <a href="api/health" class="text-sm font-semibold text-[#7C8363] hover:text-[#555C42] px-4 py-2 rounded-xl border border-[#E8E2D9] transition-all">API Status</a>
                <a href="#setup" class="text-sm font-semibold bg-[#2D2D26] text-[#FDFBF7] hover:bg-[#7C8363] px-5 py-2.5 rounded-xl transition-all shadow-sm">Hosting Setup Guide</a>
            </div>
        </div>
    </header>

    <!-- Main Hero -->
    <main class="flex-1 max-w-6xl mx-auto px-6 py-16">
        <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE5DB] text-[#555C42] text-xs font-semibold uppercase tracking-wider mb-6">
                <span class="w-2 h-2 rounded-full bg-[#7C8363] animate-pulse"></span>
                Native PHP 8.2+ & MySQL 8+ Ready
            </span>
            <h2 class="font-serif text-5xl sm:text-6xl font-bold text-[#2D2D26] leading-[1.15] mb-6">
                Self-Hosted Autonomous AI Business Operating System
            </h2>
            <p class="text-lg text-[#555C42] leading-relaxed mb-8">
                Your dedicated PHP deployment package is ready. All core modules—including Multi-Tenant CRM, Google Gemini RAG Knowledge Base, Lead Scoring, Quotations, and Automations—are packaged in this directory for direct cPanel and VPS hosting.
            </p>
            <div class="flex flex-wrap items-center justify-center gap-4">
                <a href="#endpoints" class="px-6 py-3.5 rounded-2xl bg-[#7C8363] text-white font-semibold shadow-md hover:bg-[#555C42] transition-all">
                    Explore REST API Endpoints
                </a>
                <a href="#db" class="px-6 py-3.5 rounded-2xl bg-[#EBE5DB] text-[#2D2D26] font-semibold border border-[#D5CEBF] hover:bg-[#D5CEBF] transition-all">
                    Database Schema (50+ Tables)
                </a>
            </div>
        </div>

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16" id="setup">
            <div class="p-8 rounded-3xl bg-white border border-[#E8E2D9] shadow-sm">
                <div class="w-12 h-12 rounded-2xl bg-[#EBE5DB] text-[#7C8363] flex items-center justify-center mb-5 font-bold text-xl">1</div>
                <h3 class="font-serif text-xl font-bold text-[#2D2D26] mb-2">Import MySQL Schema</h3>
                <p class="text-sm text-[#8A8A7C] leading-relaxed mb-4">
                    Import <code class="text-xs bg-[#F5F2EB] px-2 py-1 rounded text-[#555C42]">database/schema.sql</code> via phpMyAdmin or MySQL CLI to create all 50+ normalized multi-tenant tables.
                </p>
            </div>
            <div class="p-8 rounded-3xl bg-white border border-[#E8E2D9] shadow-sm">
                <div class="w-12 h-12 rounded-2xl bg-[#EBE5DB] text-[#7C8363] flex items-center justify-center mb-5 font-bold text-xl">2</div>
                <h3 class="font-serif text-xl font-bold text-[#2D2D26] mb-2">Configure .env File</h3>
                <p class="text-sm text-[#8A8A7C] leading-relaxed mb-4">
                    Copy <code class="text-xs bg-[#F5F2EB] px-2 py-1 rounded text-[#555C42]">.env.example</code> to <code class="text-xs bg-[#F5F2EB] px-2 py-1 rounded text-[#555C42]">.env</code> and fill in your MySQL credentials and Google Gemini API Key.
                </p>
            </div>
            <div class="p-8 rounded-3xl bg-white border border-[#E8E2D9] shadow-sm">
                <div class="w-12 h-12 rounded-2xl bg-[#EBE5DB] text-[#7C8363] flex items-center justify-center mb-5 font-bold text-xl">3</div>
                <h3 class="font-serif text-xl font-bold text-[#2D2D26] mb-2">Set Up Automations Cron</h3>
                <p class="text-sm text-[#8A8A7C] leading-relaxed mb-4">
                    Schedule <code class="text-xs bg-[#F5F2EB] px-2 py-1 rounded text-[#555C42]">cron/run_automations.php</code> every 5 minutes in your cPanel Crontab to automate follow-up emails and tasks.
                </p>
            </div>
        </div>

        <!-- Endpoints List -->
        <div class="p-8 rounded-3xl bg-white border border-[#E8E2D9] shadow-sm" id="endpoints">
            <h3 class="font-serif text-2xl font-bold text-[#2D2D26] mb-6">Standard Native REST PHP API Endpoints</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div class="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9]">
                    <span class="text-xs font-bold text-[#7C8363] uppercase">Auth</span>
                    <p class="font-mono text-xs text-[#2D2D26] mt-1 font-semibold">/api/auth/login.php</p>
                    <p class="font-mono text-xs text-[#2D2D26] mt-0.5 font-semibold">/api/auth/register.php</p>
                </div>
                <div class="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9]">
                    <span class="text-xs font-bold text-[#7C8363] uppercase">CRM & Leads</span>
                    <p class="font-mono text-xs text-[#2D2D26] mt-1 font-semibold">/api/leads/index.php</p>
                    <p class="font-mono text-xs text-[#2D2D26] mt-0.5 font-semibold">/api/customers/index.php</p>
                </div>
                <div class="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9]">
                    <span class="text-xs font-bold text-[#7C8363] uppercase">AI Services & RAG</span>
                    <p class="font-mono text-xs text-[#2D2D26] mt-1 font-semibold">/api/ai/chat.php</p>
                    <p class="font-mono text-xs text-[#2D2D26] mt-0.5 font-semibold">/api/ai/generate.php</p>
                </div>
                <div class="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9]">
                    <span class="text-xs font-bold text-[#7C8363] uppercase">Knowledge Base</span>
                    <p class="font-mono text-xs text-[#2D2D26] mt-1 font-semibold">/api/knowledge/index.php</p>
                </div>
                <div class="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9]">
                    <span class="text-xs font-bold text-[#7C8363] uppercase">Web Chatbot Widget</span>
                    <p class="font-mono text-xs text-[#2D2D26] mt-1 font-semibold">/api/chat/widget.php</p>
                </div>
                <div class="p-4 rounded-2xl bg-[#FDFBF7] border border-[#E8E2D9]">
                    <span class="text-xs font-bold text-[#7C8363] uppercase">Billing & Quotas</span>
                    <p class="font-mono text-xs text-[#2D2D26] mt-1 font-semibold">/api/billing/index.php</p>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-[#E8E2D9] py-8 bg-[#FDFBF7] text-center text-xs text-[#8A8A7C]">
        <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© <?php echo date('Y'); ?> BharatAI Business OS. Crafted for high-performance multi-tenant hosting.</p>
            <p>PHP 8.2+ • MySQL 8+ • Apache mod_rewrite</p>
        </div>
    </footer>
</body>
</html>
