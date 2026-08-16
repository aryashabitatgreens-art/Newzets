<?php
/**
 * Billing & Subscription API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$auth = AuthMiddleware::requireAuth();
$bizId = PermissionMiddleware::enforceBusinessTenant();
$service = new BillingService();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $plans = $service->getPlans();
    $subscription = $service->getActiveSubscription($bizId);
    $db = Database::getInstance();
    $payments = $db->fetchAll("SELECT * FROM payments WHERE business_id = ? ORDER BY created_at DESC LIMIT 10", [$bizId]);

    jsonResponse([
        'plans' => $plans,
        'subscription' => $subscription,
        'payments' => $payments
    ]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $planId = (int)($input['plan_id'] ?? 0);
    $cycle = $input['billing_cycle'] ?? 'monthly';
    $coupon = $input['coupon_code'] ?? null;

    if (!$planId) {
        jsonResponse(null, 422, 'Plan ID is required.');
    }

    $result = $service->upgradePlan($bizId, $planId, $cycle, $coupon);
    logAudit('billing.plan_upgraded', $bizId, ['plan_id' => $planId, 'cycle' => $cycle]);

    jsonResponse($result, 200, 'Subscription updated successfully.');
}
