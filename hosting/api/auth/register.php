<?php
/**
 * Authentication: Register Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(null, 405, 'Method Not Allowed');
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$fullName = trim($input['full_name'] ?? '');
$email = trim(filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL));
$password = (string)($input['password'] ?? '');
$businessName = trim($input['business_name'] ?? '');
$phone = trim($input['phone'] ?? '');

$errors = [];
if (empty($fullName)) $errors['full_name'] = 'Full name is required';
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Valid email is required';
if (strlen($password) < 6) $errors['password'] = 'Password must be at least 6 characters';

if (!empty($errors)) {
    jsonResponse(null, 422, 'Validation failed', $errors);
}

$db = Database::getInstance();

// Check if email exists
$existing = $db->fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
if ($existing) {
    jsonResponse(null, 422, 'An account with this email address already exists.', ['email' => 'Email taken']);
}

// 1. Create User
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$userId = $db->insert('users', [
    'role_id' => 3, // Business Owner role
    'email' => $email,
    'password_hash' => $passwordHash,
    'full_name' => $fullName,
    'phone' => $phone,
    'status' => 'active',
    'created_at' => date('Y-m-d H:i:s')
]);

// 2. Create Initial Business Tenant
$bizSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $businessName ?: $fullName . ' Co')));
$bizId = $db->insert('businesses', [
    'owner_id' => $userId,
    'name' => $businessName ?: $fullName . "'s Business",
    'slug' => $bizSlug . '-' . rand(100, 999),
    'industry' => 'Technology & Services',
    'currency' => 'INR',
    'currency_symbol' => '₹',
    'status' => 'active',
    'created_at' => date('Y-m-d H:i:s')
]);

// 3. Link Membership
$db->insert('business_members', [
    'business_id' => $bizId,
    'user_id' => $userId,
    'role_id' => 3, // Business Owner
    'status' => 'active'
]);

// 4. Create Default Business Settings
$db->insert('business_settings', [
    'business_id' => $bizId,
    'ai_tone' => 'Professional and friendly',
    'ai_primary_language' => 'English'
]);

// 5. Initialize Usage Limits (Free Plan Starter)
$db->insert('usage_limits', [
    'business_id' => $bizId,
    'ai_credits_limit' => 150,
    'leads_limit' => 200,
    'team_members_limit' => 3
]);

// 6. Assign Free Starter Subscription
$starterPlan = $db->fetchOne("SELECT id FROM plans WHERE slug = 'free' OR slug = 'starter' LIMIT 1");
if ($starterPlan) {
    $db->insert('subscriptions', [
        'business_id' => $bizId,
        'plan_id' => $starterPlan['id'],
        'billing_cycle' => 'monthly',
        'status' => 'active',
        'starts_at' => date('Y-m-d H:i:s'),
        'ends_at' => date('Y-m-d H:i:s', strtotime('+30 days'))
    ]);
}

// 7. Auto-login session
$_SESSION['user'] = [
    'id' => $userId,
    'email' => $email,
    'full_name' => $fullName,
    'role_id' => 3,
    'avatar_url' => null
];

$_SESSION['active_business'] = [
    'id' => $bizId,
    'name' => $businessName ?: $fullName . "'s Business",
    'currency' => 'INR',
    'currency_symbol' => '₹',
    'role_id' => 3
];

logAudit('user.registered', $bizId, ['email' => $email], $userId);

// Trigger Welcome Email
$mailer = new MailService();
$mailer->sendTemplate($email, 'welcome_email', ['name' => $fullName], $bizId);

jsonResponse([
    'user' => $_SESSION['user'],
    'active_business' => $_SESSION['active_business'],
    'csrf_token' => csrfToken()
], 201, 'Account successfully created!');
