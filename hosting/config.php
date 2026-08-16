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

// 2. Application Constants
define('APP_NAME', env('APP_NAME', 'BharatAI Business OS'));
define('APP_ENV', env('APP_ENV', 'production'));
define('APP_DEBUG', (bool)env('APP_DEBUG', false));
define('APP_URL', rtrim((string)env('APP_URL', 'http://localhost'), '/'));
define('APP_KEY', env('APP_KEY', 'bharatai_secret_key_change_in_production'));
define('STORAGE_PATH', BHARAT_ROOT . '/storage');
define('UPLOADS_PATH', BHARAT_ROOT . '/public/uploads');

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
