<?php
/**
 * Dashboard Analytics & Real-Time Stats API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$auth = AuthMiddleware::requireAuth();
$bizId = PermissionMiddleware::enforceBusinessTenant();

$crm = new CRMService();
$metrics = $crm->getDashboardMetrics($bizId);

jsonResponse($metrics, 200, 'Dashboard statistics loaded.');
