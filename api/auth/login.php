<?php
/**
 * Authentication: Login Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(null, 405, 'Method Not Allowed');
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$email = trim(filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL));
$password = (string)($input['password'] ?? '');

if (empty($email) || empty($password)) {
    jsonResponse(null, 422, 'Email and password are required.', ['fields' => 'All fields required']);
}

$db = Database::getInstance();

// 1. Check brute force protection in login_attempts
$ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$recentAttempts = (int)($db->fetchOne(
    "SELECT COUNT(*) as c FROM login_attempts WHERE ip_address = ? AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE) AND successful = 0",
    [$ip]
)['c'] ?? 0);

if ($recentAttempts >= 8) {
    jsonResponse(null, 429, 'Too many failed login attempts. Please wait 15 minutes before trying again.');
}

// 2. Lookup user
$user = $db->fetchOne("SELECT * FROM users WHERE email = ? AND deleted_at IS NULL", [$email]);

if (!$user || !password_verify($password, $user['password_hash'])) {
    // Record failed attempt
    $db->insert('login_attempts', [
        'email' => $email,
        'ip_address' => $ip,
        'successful' => 0,
        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255)
    ]);
    jsonResponse(null, 401, 'Invalid email or password credentials.');
}

if ($user['status'] === 'suspended') {
    jsonResponse(null, 403, 'Account is suspended. Contact system administrator.');
}

// 3. Record successful attempt & log audit
$db->insert('login_attempts', [
    'email' => $email,
    'ip_address' => $ip,
    'successful' => 1,
    'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255)
]);

// Update last login
$db->update('users', ['last_login_at' => date('Y-m-d H:i:s')], 'id = ?', [$user['id']]);

// 4. Determine Active Business
$businesses = $db->fetchAll(
    "SELECT b.*, bm.role_id as member_role_id 
     FROM business_members bm
     JOIN businesses b ON b.id = bm.business_id
     WHERE bm.user_id = ? AND bm.status = 'active' AND b.deleted_at IS NULL",
    [$user['id']]
);

$activeBiz = null;
if (!empty($businesses)) {
    $activeBiz = $businesses[0];
}

// 5. Populate Session
$_SESSION['user'] = [
    'id' => (int)$user['id'],
    'email' => $user['email'],
    'full_name' => $user['full_name'],
    'role_id' => (int)$user['role_id'],
    'avatar_url' => $user['avatar_url']
];

if ($activeBiz) {
    $_SESSION['active_business'] = [
        'id' => (int)$activeBiz['id'],
        'name' => $activeBiz['name'],
        'currency' => $activeBiz['currency'] ?? 'INR',
        'currency_symbol' => $activeBiz['currency_symbol'] ?? '₹',
        'role_id' => (int)$activeBiz['member_role_id']
    ];
}

logAudit('user.login', $activeBiz['id'] ?? null, ['method' => 'password'], (int)$user['id']);

jsonResponse([
    'user' => $_SESSION['user'],
    'active_business' => $_SESSION['active_business'] ?? null,
    'businesses' => $businesses,
    'csrf_token' => csrfToken()
], 200, 'Login successful!');
