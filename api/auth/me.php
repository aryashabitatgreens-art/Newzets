<?php
/**
 * Current User & Active Business Context
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$user = currentUser();
if (!$user) {
    jsonResponse(['authenticated' => false], 200);
}

$db = Database::getInstance();

// Refresh user record
$userRecord = $db->fetchOne("SELECT id, email, full_name, role_id, avatar_url, phone, status FROM users WHERE id = ?", [$user['id']]);
if (!$userRecord || $userRecord['status'] === 'suspended') {
    session_destroy();
    jsonResponse(['authenticated' => false], 200);
}

// Fetch all businesses accessible by user
$businesses = $db->fetchAll(
    "SELECT b.id, b.name, b.slug, b.industry, b.currency, b.currency_symbol, bm.role_id as member_role_id, r.name as role_name 
     FROM business_members bm
     JOIN businesses b ON b.id = bm.business_id
     JOIN roles r ON r.id = bm.role_id
     WHERE bm.user_id = ? AND bm.status = 'active' AND b.deleted_at IS NULL",
    [$user['id']]
);

// If active business not selected or invalid, default to first
$activeBiz = currentBusiness();
if (!$activeBiz && !empty($businesses)) {
    $activeBiz = $businesses[0];
    $_SESSION['active_business'] = [
        'id' => (int)$activeBiz['id'],
        'name' => $activeBiz['name'],
        'currency' => $activeBiz['currency'] ?? 'INR',
        'currency_symbol' => $activeBiz['currency_symbol'] ?? '₹',
        'role_id' => (int)$activeBiz['member_role_id']
    ];
}

// Fetch user permissions for current role
$roleId = (int)($_SESSION['active_business']['role_id'] ?? $userRecord['role_id']);
$permissions = $db->fetchAll(
    "SELECT p.slug FROM permissions p 
     JOIN role_permissions rp ON rp.permission_id = p.id 
     WHERE rp.role_id = ?",
    [$roleId]
);

$permSlugs = array_column($permissions, 'slug');
if (isSuperAdmin()) {
    $permSlugs = ['*'];
}

// Fetch current subscription and limits for active business
$sub = null;
if ($activeBiz) {
    $billing = new BillingService();
    $sub = $billing->getActiveSubscription((int)$activeBiz['id']);
}

jsonResponse([
    'authenticated' => true,
    'user' => [
        'id' => (int)$userRecord['id'],
        'email' => $userRecord['email'],
        'full_name' => $userRecord['full_name'],
        'phone' => $userRecord['phone'],
        'role_id' => (int)$userRecord['role_id'],
        'avatar_url' => $userRecord['avatar_url']
    ],
    'active_business' => $_SESSION['active_business'] ?? null,
    'businesses' => $businesses,
    'permissions' => $permSlugs,
    'subscription' => $sub,
    'csrf_token' => csrfToken()
]);
