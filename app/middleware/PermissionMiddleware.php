<?php
/**
 * Multi-Tenant Isolation & Permission Middleware
 */

declare(strict_types=1);

class PermissionMiddleware {
    /**
     * Enforce and verify business tenant isolation
     * Ensures the current user actually has access to the business ID.
     */
    public static function enforceBusinessTenant(?int $requestedBusinessId = null): int {
        $user = AuthMiddleware::requireAuth();
        $userId = (int)$user['id'];
        $db = Database::getInstance();

        // If Super Admin, can access any business
        if (isSuperAdmin()) {
            if ($requestedBusinessId) {
                $biz = $db->fetchOne("SELECT * FROM businesses WHERE id = ? AND deleted_at IS NULL", [$requestedBusinessId]);
                if ($biz) {
                    $_SESSION['active_business'] = $biz;
                    return (int)$biz['id'];
                }
            }
            // fallback to default
            $biz = $db->fetchOne("SELECT * FROM businesses WHERE deleted_at IS NULL LIMIT 1");
            if ($biz) {
                $_SESSION['active_business'] = $biz;
                return (int)$biz['id'];
            }
        }

        // If specific business requested, verify membership
        if ($requestedBusinessId) {
            $membership = $db->fetchOne(
                "SELECT bm.*, b.name, b.currency, b.currency_symbol, b.status 
                 FROM business_members bm
                 JOIN businesses b ON b.id = bm.business_id
                 WHERE bm.business_id = ? AND bm.user_id = ? AND bm.status = 'active' AND b.deleted_at IS NULL",
                [$requestedBusinessId, $userId]
            );

            if (!$membership) {
                jsonResponse(null, 403, 'Unauthorized access to this business tenant.');
            }

            $_SESSION['active_business'] = [
                'id' => $membership['business_id'],
                'name' => $membership['name'],
                'currency' => $membership['currency'] ?? 'INR',
                'currency_symbol' => $membership['currency_symbol'] ?? '₹',
                'role_id' => $membership['role_id']
            ];
            return (int)$membership['business_id'];
        }

        // Use session active business if already set & verified
        if (!empty($_SESSION['active_business']['id'])) {
            return (int)$_SESSION['active_business']['id'];
        }

        // Find first active business for user
        $firstBiz = $db->fetchOne(
            "SELECT bm.business_id, b.name, b.currency, b.currency_symbol, bm.role_id 
             FROM business_members bm
             JOIN businesses b ON b.id = bm.business_id
             WHERE bm.user_id = ? AND bm.status = 'active' AND b.deleted_at IS NULL 
             LIMIT 1",
            [$userId]
        );

        if ($firstBiz) {
            $_SESSION['active_business'] = [
                'id' => (int)$firstBiz['business_id'],
                'name' => $firstBiz['name'],
                'currency' => $firstBiz['currency'] ?? 'INR',
                'currency_symbol' => $firstBiz['currency_symbol'] ?? '₹',
                'role_id' => (int)$firstBiz['role_id']
            ];
            return (int)$firstBiz['business_id'];
        }

        // If no business exists, user needs onboarding
        if (str_contains($_SERVER['REQUEST_URI'] ?? '', '/dashboard/onboarding.php') || str_starts_with($_SERVER['REQUEST_URI'] ?? '', '/api/auth/onboarding')) {
            return 0; // Allowed during onboarding wizard
        }

        if (str_starts_with($_SERVER['REQUEST_URI'] ?? '', '/api/')) {
            jsonResponse(['onboarding_required' => true], 403, 'Business setup required. Please complete onboarding.');
        }

        header('Location: /dashboard/onboarding.php');
        exit;
    }

    /**
     * Check if user has a specific permission
     */
    public static function hasPermission(string $permissionSlug): bool {
        if (isSuperAdmin()) {
            return true;
        }

        $user = currentUser();
        if (!$user) return false;

        $roleId = (int)($_SESSION['active_business']['role_id'] ?? $user['role_id'] ?? 0);
        $db = Database::getInstance();

        $perm = $db->fetchOne(
            "SELECT p.id 
             FROM permissions p
             JOIN role_permissions rp ON rp.permission_id = p.id
             WHERE rp.role_id = ? AND p.slug = ?",
            [$roleId, $permissionSlug]
        );

        return $perm !== null;
    }

    /**
     * Require permission or abort
     */
    public static function requirePermission(string $permissionSlug): void {
        if (!self::hasPermission($permissionSlug)) {
            jsonResponse(null, 403, "Forbidden: Missing required permission [{$permissionSlug}].");
        }
    }
}
