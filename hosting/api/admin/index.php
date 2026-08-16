<?php
/**
 * Super Admin Management API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

AuthMiddleware::requireAdmin();
$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'overview';

// 1. Health check & System Overview
if ($action === 'overview' && $method === 'GET') {
    $totalUsers = (int)($db->fetchOne("SELECT COUNT(*) as c FROM users WHERE deleted_at IS NULL")['c'] ?? 0);
    $totalBusinesses = (int)($db->fetchOne("SELECT COUNT(*) as c FROM businesses WHERE deleted_at IS NULL")['c'] ?? 0);
    $totalAiCalls = (int)($db->fetchOne("SELECT COUNT(*) as c FROM ai_usage")['c'] ?? 0);
    $totalRevenue = (float)($db->fetchOne("SELECT SUM(amount) as s FROM payments WHERE status = 'completed'")['s'] ?? 0);

    // AI Providers
    $providers = $db->fetchAll("SELECT * FROM ai_providers ORDER BY priority ASC");
    $models = $db->fetchAll("SELECT m.*, p.name as provider_name FROM ai_models m JOIN ai_providers p ON p.id = m.provider_id ORDER BY m.id ASC");

    // Health Info
    $health = [
        'php_version' => PHP_VERSION,
        'database_driver' => env('DB_CONNECTION', 'sqlite'),
        'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
        'storage_writable' => is_writable(STORAGE_PATH),
        'uploads_writable' => is_writable(UPLOADS_PATH),
        'server_time' => date('Y-m-d H:i:s'),
        'gemini_configured' => !empty(env('GEMINI_API_KEY')),
        'openai_configured' => !empty(env('OPENAI_API_KEY'))
    ];

    // Recent Audit Logs
    $recentAudits = $db->fetchAll("SELECT a.*, u.email as user_email FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 15");

    jsonResponse([
        'stats' => [
            'total_users' => $totalUsers,
            'total_businesses' => $totalBusinesses,
            'total_ai_calls' => $totalAiCalls,
            'total_revenue' => $totalRevenue
        ],
        'health' => $health,
        'providers' => $providers,
        'models' => $models,
        'recent_audits' => $recentAudits
    ]);
}

// 2. Users Management
if ($action === 'users') {
    if ($method === 'GET') {
        $users = $db->fetchAll("SELECT u.id, u.email, u.full_name, u.role_id, u.status, u.created_at, u.last_login_at, r.name as role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.deleted_at IS NULL ORDER BY u.id DESC LIMIT 50");
        jsonResponse(['users' => $users]);
    }
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $userId = (int)($input['user_id'] ?? 0);
        $status = $input['status'] ?? 'active';
        $roleId = !empty($input['role_id']) ? (int)$input['role_id'] : null;

        $update = ['status' => $status];
        if ($roleId) $update['role_id'] = $roleId;

        $db->update('users', $update, 'id = ?', [$userId]);
        logAudit('admin.user_updated', null, ['target_user_id' => $userId, 'status' => $status]);
        jsonResponse(null, 200, 'User updated.');
    }
}

// 3. Businesses Management
if ($action === 'businesses' && $method === 'GET') {
    $businesses = $db->fetchAll(
        "SELECT b.*, u.email as owner_email, u.full_name as owner_name, 
                (SELECT COUNT(*) FROM leads WHERE business_id = b.id) as leads_count,
                (SELECT COUNT(*) FROM ai_usage WHERE business_id = b.id) as ai_calls_count
         FROM businesses b
         JOIN users u ON u.id = b.owner_id
         WHERE b.deleted_at IS NULL
         ORDER BY b.id DESC"
    );
    jsonResponse(['businesses' => $businesses]);
}

// 4. AI Usage Logs
if ($action === 'ai_logs' && $method === 'GET') {
    $logs = $db->fetchAll(
        "SELECT au.*, b.name as business_name, u.email as user_email 
         FROM ai_usage au
         LEFT JOIN businesses b ON b.id = au.business_id
         LEFT JOIN users u ON u.id = au.user_id
         ORDER BY au.id DESC LIMIT 50"
    );
    jsonResponse(['logs' => $logs]);
}

// 5. Update AI Provider Settings
if ($action === 'update_provider' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $providerId = (int)($input['id'] ?? 0);
    $isEnabled = !empty($input['is_enabled']) ? 1 : 0;
    $priority = (int)($input['priority'] ?? 1);

    $db->update('ai_providers', [
        'is_enabled' => $isEnabled,
        'priority' => $priority
    ], 'id = ?', [$providerId]);

    logAudit('admin.ai_provider_updated', null, ['provider_id' => $providerId]);
    jsonResponse(null, 200, 'Provider settings saved.');
}
