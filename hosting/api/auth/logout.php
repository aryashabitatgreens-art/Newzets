<?php
/**
 * Authentication: Logout Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

if (currentUserId()) {
    logAudit('user.logout', currentBusinessId(), [], currentUserId());
}

$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

if (str_starts_with($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') || str_starts_with($_SERVER['REQUEST_URI'] ?? '', '/api/')) {
    jsonResponse(null, 200, 'Logged out successfully');
}

header('Location: /auth/login.php');
exit;
