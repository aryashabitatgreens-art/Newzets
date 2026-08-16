<?php
/**
 * Authentication Middleware
 */

declare(strict_types=1);

class AuthMiddleware {
    /**
     * Require an authenticated session (Web UI)
     */
    public static function requireAuth(): array {
        if (empty($_SESSION['user']) || empty($_SESSION['user']['id'])) {
            if (self::isApiRequest()) {
                jsonResponse(null, 401, 'Unauthorized. Please login or provide a valid API key.');
            }
            $_SESSION['intended_url'] = $_SERVER['REQUEST_URI'] ?? '/dashboard/index.php';
            header('Location: /auth/login.php');
            exit;
        }

        // Check if user is active
        $user = $_SESSION['user'];
        if (($user['status'] ?? '') === 'suspended') {
            unset($_SESSION['user'], $_SESSION['active_business']);
            if (self::isApiRequest()) {
                jsonResponse(null, 403, 'Your account has been suspended. Please contact support.');
            }
            header('Location: /auth/login.php?error=suspended');
            exit;
        }

        return $user;
    }

    /**
     * Require Super Admin or Admin role
     */
    public static function requireAdmin(): array {
        $user = self::requireAuth();
        $roleId = (int)($user['role_id'] ?? 0);
        if (!in_array($roleId, [1, 2], true)) {
            if (self::isApiRequest()) {
                jsonResponse(null, 403, 'Forbidden: Administrative privileges required.');
            }
            header('Location: /dashboard/index.php?error=unauthorized');
            exit;
        }
        return $user;
    }

    /**
     * Require API Authentication (Bearer Token / API Key or Session)
     */
    public static function requireApiAuth(): array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(bk_[a-zA-Z0-9_]+)/', $authHeader, $matches)) {
            $apiKey = $matches[1];
            $keyHash = hash('sha256', $apiKey);

            $db = Database::getInstance();
            $keyRecord = $db->fetchOne(
                "SELECT ak.*, b.name as business_name, b.status as business_status, u.email as user_email 
                 FROM api_keys ak
                 JOIN businesses b ON b.id = ak.business_id
                 JOIN users u ON u.id = ak.user_id
                 WHERE ak.key_hash = ? AND ak.is_active = 1",
                [$keyHash]
            );

            if (!$keyRecord) {
                jsonResponse(null, 401, 'Invalid or expired API Key.');
            }

            if (!empty($keyRecord['expires_at']) && strtotime($keyRecord['expires_at']) < time()) {
                jsonResponse(null, 401, 'API Key has expired.');
            }

            // Update last used timestamp
            $db->query("UPDATE api_keys SET last_used_at = NOW() WHERE id = ?", [$keyRecord['id']]);

            // Set simulated session context for the API call
            $_SESSION['api_auth'] = true;
            $_SESSION['user'] = [
                'id' => $keyRecord['user_id'],
                'email' => $keyRecord['user_email'],
                'role_id' => 3
            ];
            $_SESSION['active_business'] = [
                'id' => $keyRecord['business_id'],
                'name' => $keyRecord['business_name']
            ];

            return [
                'type' => 'api_key',
                'business_id' => (int)$keyRecord['business_id'],
                'user_id' => (int)$keyRecord['user_id'],
                'permissions' => json_decode($keyRecord['permissions_json'] ?? '[]', true) ?: []
            ];
        }

        // Fallback to active session
        $user = self::requireAuth();
        return [
            'type' => 'session',
            'business_id' => currentBusinessId(),
            'user_id' => (int)$user['id'],
            'permissions' => ['*']
        ];
    }

    /**
     * Helper to detect JSON API request
     */
    private static function isApiRequest(): bool {
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        return str_starts_with($uri, '/api/') || str_contains($accept, 'application/json');
    }
}
