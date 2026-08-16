<?php
/**
 * BharatAI Business OS - Hosting Configuration & Bootstrap
 * Compatible with cPanel, Shared Hosting, Apache, VPS, and AWS EC2.
 *
 * @package BharatAI
 * @version 1.0.0
 */

declare(strict_types=1);

if (!defined('BHARAT_ROOT')) {
    define('BHARAT_ROOT', __DIR__);
}

// 1. Simple Environment Variable Loader (.env)
function loadEnv(string $path): void {
    if (!file_exists($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (strpos($line, '=') !== false) {
            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            // Remove surrounding quotes
            if (preg_match('/^(["\']).*\1$/m', $value)) {
                $value = substr($value, 1, -1);
            }
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv("{$name}={$value}");
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

loadEnv(BHARAT_ROOT . '/.env');
loadEnv(BHARAT_ROOT . '/.env.local');

// Environment Helper Function
function env(string $key, mixed $default = null): mixed {
    $val = getenv($key);
    if ($val === false) {
        $val = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
    }
    if ($val === 'true' || $val === '(true)') return true;
    if ($val === 'false' || $val === '(false)') return false;
    if ($val === 'null' || $val === '(null)') return null;
    return $val;
}

// ==============================================================================
// 1. DIRECT DATABASE CONFIGURATION (Enter your cPanel / MySQL Details Here)
// ==============================================================================
// You can enter your database credentials directly here OR use a .env file.
define('DB_CONNECTION', env('DB_CONNECTION', 'mysql'));      // 'mysql' for cPanel/Production, 'sqlite' for local
define('DB_HOST',       env('DB_HOST', 'localhost'));        // Usually 'localhost' or '127.0.0.1' in cPanel
define('DB_PORT',       (int)env('DB_PORT', 3306));          // Default MySQL port is 3306
define('DB_NAME',       env('DB_NAME', 'cpaneluser_bharataidb')); // Your MySQL Database Name
define('DB_USER',       env('DB_USER', 'cpaneluser_dbuser'));     // Your MySQL Database Username
define('DB_PASSWORD',   env('DB_PASSWORD', 'your_mysql_password')); // Your MySQL Database Password

// ==============================================================================
// 2. AI PROVIDER CONFIGURATION (Google Gemini / OpenAI / Anthropic)
// ==============================================================================
define('GEMINI_API_KEY',        env('GEMINI_API_KEY', '')); // Paste your Google Gemini API Key here
define('GEMINI_DEFAULT_MODEL',  env('GEMINI_DEFAULT_MODEL', 'gemini-2.5-flash'));
define('OPENAI_API_KEY',        env('OPENAI_API_KEY', ''));
define('ANTHROPIC_API_KEY',     env('ANTHROPIC_API_KEY', ''));

// ==============================================================================
// 3. APPLICATION SETTINGS
// ==============================================================================
define('APP_NAME',      env('APP_NAME', 'BharatAI Business OS'));
define('APP_ENV',       env('APP_ENV', 'production'));       // 'production' or 'development'
define('APP_DEBUG',     (bool)env('APP_DEBUG', false));      // Set true to show error traces
define('APP_URL',       rtrim((string)env('APP_URL', 'http://localhost'), '/'));
define('APP_KEY',       env('APP_KEY', 'bharatai_secret_key_change_in_production'));
define('STORAGE_PATH',  BHARAT_ROOT . '/storage');
define('UPLOADS_PATH',  BHARAT_ROOT . '/public/uploads');

// 3. Error Handling
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    if (!is_dir(STORAGE_PATH . '/logs')) {
        @mkdir(STORAGE_PATH . '/logs', 0775, true);
    }
    ini_set('error_log', STORAGE_PATH . '/logs/php_errors.log');
}

// 4. Secure Session Management
if (session_status() === PHP_SESSION_NONE) {
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
                (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    
    session_set_cookie_params([
        'lifetime' => (int)env('SESSION_LIFETIME', 7200),
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// 5. Require Core App Services & Middleware
require_once BHARAT_ROOT . '/app/helpers/functions.php';
require_once BHARAT_ROOT . '/app/config/database.php';
require_once BHARAT_ROOT . '/app/services/AIService.php';
require_once BHARAT_ROOT . '/app/services/CRMService.php';
require_once BHARAT_ROOT . '/app/services/KnowledgeService.php';
require_once BHARAT_ROOT . '/app/services/BillingService.php';
require_once BHARAT_ROOT . '/app/services/MailService.php';
require_once BHARAT_ROOT . '/app/services/DocumentService.php';
require_once BHARAT_ROOT . '/app/services/AutomationService.php';
require_once BHARAT_ROOT . '/app/services/WebhookService.php';
require_once BHARAT_ROOT . '/app/middleware/AuthMiddleware.php';
require_once BHARAT_ROOT . '/app/middleware/PermissionMiddleware.php';
