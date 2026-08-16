<?php
/**
 * Customers Management API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$auth = AuthMiddleware::requireApiAuth();
$bizId = PermissionMiddleware::enforceBusinessTenant();
$db = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $where = ["c.business_id = ?", "c.deleted_at IS NULL"];
    $params = [$bizId];

    if (!empty($search)) {
        $where[] = "(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.company LIKE ?)";
        $s = "%{$search}%";
        $params = array_merge($params, [$s, $s, $s, $s]);
    }

    $whereSql = implode(' AND ', $where);
    $customers = $db->fetchAll(
        "SELECT c.*, u.full_name as assigned_user_name,
                (SELECT COUNT(*) FROM invoices WHERE customer_id = c.id) as invoice_count,
                (SELECT COUNT(*) FROM quotations WHERE customer_id = c.id) as quote_count
         FROM customers c
         LEFT JOIN users u ON u.id = c.assigned_user_id
         WHERE {$whereSql}
         ORDER BY c.created_at DESC",
        $params
    );

    jsonResponse(['customers' => $customers, 'total' => count($customers)]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    if (empty($input['name'])) {
        jsonResponse(null, 422, 'Customer name is required.');
    }

    $customerId = $db->insert('customers', [
        'business_id' => $bizId,
        'assigned_user_id' => !empty($input['assigned_user_id']) ? (int)$input['assigned_user_id'] : currentUserId(),
        'name' => trim($input['name']),
        'email' => trim($input['email'] ?? ''),
        'phone' => trim($input['phone'] ?? ''),
        'company' => trim($input['company'] ?? ''),
        'city' => trim($input['city'] ?? ''),
        'state' => trim($input['state'] ?? ''),
        'country' => trim($input['country'] ?? 'India'),
        'lifetime_value' => (float)($input['lifetime_value'] ?? 0.00),
        'status' => 'active'
    ]);

    $created = $db->fetchOne("SELECT * FROM customers WHERE id = ?", [$customerId]);
    logAudit('customer.created', $bizId, ['customer_id' => $customerId, 'name' => $input['name']]);

    jsonResponse($created, 201, 'Customer created successfully.');
}
