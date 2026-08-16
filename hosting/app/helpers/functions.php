<?php
/**
 * Global Helper Functions
 */

declare(strict_types=1);

/**
 * Escape HTML output to prevent XSS
 */
function e(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Standardized JSON API Response
 */
function jsonResponse(mixed $data = null, int $statusCode = 200, string $message = '', array $errors = []): void {
    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
    }

    echo json_encode([
        'success' => $statusCode >= 200 && $statusCode < 300,
        'data' => $data,
        'message' => $message,
        'errors' => $errors,
        'timestamp' => time()
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Generate or retrieve CSRF Token
 */
function csrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF Token from POST or Header
 */
function verifyCsrfToken(?string $token = null): bool {
    if ($token === null) {
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
    }
    if (!$token || empty($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Get current logged in user from session
 */
function currentUser(): ?array {
    return $_SESSION['user'] ?? null;
}

/**
 * Get current logged in user ID
 */
function currentUserId(): ?int {
    return isset($_SESSION['user']['id']) ? (int)$_SESSION['user']['id'] : null;
}

/**
 * Get active business for the logged in user
 */
function currentBusiness(): ?array {
    if (!empty($_SESSION['active_business'])) {
        return $_SESSION['active_business'];
    }
    return null;
}

/**
 * Get active business ID
 */
function currentBusinessId(): ?int {
    if (!empty($_SESSION['active_business']['id'])) {
        return (int)$_SESSION['active_business']['id'];
    }
    if (!empty($_SESSION['user']['current_business_id'])) {
        return (int)$_SESSION['user']['current_business_id'];
    }
    return null;
}

/**
 * Check if current user is Super Admin
 */
function isSuperAdmin(): bool {
    return isset($_SESSION['user']['role_id']) && (int)$_SESSION['user']['role_id'] === 1;
}

/**
 * Check if current user has an admin or super admin role
 */
function isAdmin(): bool {
    $roleId = (int)($_SESSION['user']['role_id'] ?? 0);
    return in_array($roleId, [1, 2], true);
}

/**
 * Format currency with symbol
 */
function formatCurrency(float $amount, string $currency = 'INR', string $symbol = '₹'): string {
    return $symbol . ' ' . number_format($amount, 2, '.', ',');
}

/**
 * Human-readable relative time (e.g. "2 hours ago")
 */
function timeAgo(string|int|null $time): string {
    if (!$time) return 'Never';
    $timestamp = is_numeric($time) ? (int)$time : strtotime($time);
    if (!$timestamp) return 'Never';

    $diff = time() - $timestamp;
    if ($diff < 60) return 'Just now';
    if ($diff < 3600) {
        $m = max(1, floor($diff / 60));
        return $m . ' min' . ($m > 1 ? 's' : '') . ' ago';
    }
    if ($diff < 86400) {
        $h = floor($diff / 3600);
        return $h . ' hour' . ($h > 1 ? 's' : '') . ' ago';
    }
    if ($diff < 604800) {
        $d = floor($diff / 86400);
        return $d . ' day' . ($d > 1 ? 's' : '') . ' ago';
    }
    return date('M j, Y', $timestamp);
}

/**
 * Record Audit Log in Database
 */
function logAudit(string $action, ?int $businessId = null, array|string $metadata = [], ?int $userId = null): void {
    try {
        $db = Database::getInstance();
        $userId = $userId ?? currentUserId();
        $businessId = $businessId ?? currentBusinessId();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);
        $metaJson = is_array($metadata) ? json_encode($metadata) : $metadata;

        $db->query(
            "INSERT INTO audit_logs (business_id, user_id, action, ip_address, user_agent, metadata_json, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [$businessId, $userId, $action, $ip, $ua, $metaJson]
        );
    } catch (\Throwable $e) {
        // Fallback to error log if database is not reachable
        error_log("Audit Log Error: " . $e->getMessage());
    }
}

/**
 * Record System Log
 */
function logSystem(string $level, string $channel, string $message, array $context = []): void {
    try {
        $db = Database::getInstance();
        $db->query(
            "INSERT INTO system_logs (level, channel, message, context_json, created_at) VALUES (?, ?, ?, ?, NOW())",
            [$level, $channel, $message, json_encode($context)]
        );
    } catch (\Throwable $e) {
        error_log("[{$level}][{$channel}] {$message}");
    }
}

/**
 * Simple translation helper (i18n ready)
 */
function __(string $key, array $replace = [], string $lang = 'en'): string {
    static $translations = [
        'en' => [
            'dashboard' => 'Dashboard',
            'leads' => 'Leads',
            'customers' => 'Customers',
            'ai_assistant' => 'AI Assistant',
            'knowledge_base' => 'Knowledge Base',
            'proposals' => 'Proposals',
            'quotations' => 'Quotations',
            'invoices' => 'Invoices',
            'settings' => 'Settings',
            'chatbot' => 'AI Chatbot',
            'campaigns' => 'Campaigns',
            'automations' => 'Automations',
            'billing' => 'Billing & Plans',
            'support' => 'Support Tickets'
        ],
        'hi' => [
            'dashboard' => 'डैशबोर्ड',
            'leads' => 'लीड्स',
            'customers' => 'ग्राहक',
            'ai_assistant' => 'एआई सहायक',
            'knowledge_base' => 'नॉलेज बेस',
            'proposals' => 'प्रस्ताव',
            'quotations' => 'कोटेशन',
            'invoices' => 'चालान',
            'settings' => 'सेटिंग्स',
            'chatbot' => 'एआई चैटबॉट',
            'campaigns' => 'अभियान',
            'automations' => 'ऑटोमेशन',
            'billing' => 'बिलिंग और योजनाएं',
            'support' => 'सहायता टिकट'
        ]
    ];

    $text = $translations[$lang][$key] ?? $translations['en'][$key] ?? $key;
    foreach ($replace as $placeholder => $value) {
        $text = str_replace(':' . $placeholder, (string)$value, $text);
    }
    return $text;
}

/**
 * Clean & sanitize user input string
 */
function sanitizeInput(mixed $input): mixed {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    if (is_string($input)) {
        return trim(strip_tags($input));
    }
    return $input;
}

/**
 * Generate Secure API Key Pair
 */
function generateApiKeyPair(): array {
    $prefix = 'bk_' . substr(bin2hex(random_bytes(4)), 0, 8);
    $secret = bin2hex(random_bytes(24));
    $fullKey = $prefix . '_' . $secret;
    $hash = hash('sha256', $fullKey);

    return [
        'full_key' => $fullKey,
        'prefix' => $prefix,
        'hash' => $hash
    ];
}
