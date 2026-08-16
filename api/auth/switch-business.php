<?php
/**
 * Switch Active Multi-Tenant Business Context
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

AuthMiddleware::requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(null, 405, 'Method Not Allowed');
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$targetBizId = (int)($input['business_id'] ?? 0);

if (!$targetBizId) {
    jsonResponse(null, 422, 'Business ID is required.');
}

$bizId = PermissionMiddleware::enforceBusinessTenant($targetBizId);

jsonResponse([
    'active_business' => $_SESSION['active_business']
], 200, 'Business switched successfully.');
