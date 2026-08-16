<?php
/**
 * CRM Leads API Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$auth = AuthMiddleware::requireApiAuth();
$bizId = PermissionMiddleware::enforceBusinessTenant();
$crm = new CRMService();
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET: List Leads
if ($method === 'GET') {
    $filters = [
        'status_id' => $_GET['status_id'] ?? null,
        'source_id' => $_GET['source_id'] ?? null,
        'priority' => $_GET['priority'] ?? null,
        'search' => $_GET['search'] ?? null
    ];
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(5, min(100, (int)($_GET['per_page'] ?? 20)));

    $result = $crm->getLeads($bizId, $filters, $page, $perPage);
    
    // Also attach metadata (statuses, sources)
    $db = Database::getInstance();
    $statuses = $db->fetchAll("SELECT * FROM lead_statuses WHERE business_id = ? OR business_id IS NULL ORDER BY sort_order ASC", [$bizId]);
    $sources = $db->fetchAll("SELECT * FROM lead_sources WHERE business_id = ? OR business_id IS NULL ORDER BY name ASC", [$bizId]);

    $result['statuses'] = $statuses;
    $result['sources'] = $sources;

    jsonResponse($result);
}

// Handle POST: Create, AI Qualify, Convert
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $action = $_GET['action'] ?? $input['action'] ?? 'create';
    $db = Database::getInstance();

    if ($action === 'create') {
        PermissionMiddleware::requirePermission('leads.create');
        if (empty($input['name'])) {
            jsonResponse(null, 422, 'Lead name is required.');
        }

        $leadId = $crm->createLead($bizId, $input);
        $createdLead = $db->fetchOne("SELECT * FROM leads WHERE id = ?", [$leadId]);
        logAudit('lead.created', $bizId, ['lead_id' => $leadId, 'name' => $input['name']]);

        jsonResponse($createdLead, 201, 'Lead created successfully.');
    }

    if ($action === 'qualify') {
        $leadId = (int)($input['lead_id'] ?? 0);
        $lead = $db->fetchOne("SELECT * FROM leads WHERE id = ? AND business_id = ?", [$leadId, $bizId]);
        if (!$lead) {
            jsonResponse(null, 404, 'Lead not found.');
        }

        $ai = new AIService();
        $res = $ai->qualifyLead($lead);

        if ($res['success'] && !empty($res['data'])) {
            $data = $res['data'];
            $db->update('leads', [
                'ai_score' => (int)($data['score'] ?? 75),
                'ai_summary' => $data['summary'] ?? '',
                'ai_intent' => $data['intent'] ?? '',
                'ai_buying_probability' => $data['buying_probability'] ?? '',
                'priority' => strtolower($data['priority'] ?? $lead['priority'])
            ], 'id = ?', [$leadId]);

            // Add activity log
            $db->insert('lead_activities', [
                'business_id' => $bizId,
                'lead_id' => $leadId,
                'user_id' => currentUserId(),
                'activity_type' => 'ai_qualified',
                'description' => "AI Qualification: Score {$data['score']}/100 - {$data['intent']}"
            ]);

            logAudit('lead.ai_qualified', $bizId, ['lead_id' => $leadId, 'score' => $data['score']]);
            jsonResponse($data, 200, 'Lead qualified by AI.');
        } else {
            jsonResponse(null, 500, $res['error'] ?? 'AI Qualification failed.');
        }
    }

    if ($action === 'convert') {
        $leadId = (int)($input['lead_id'] ?? 0);
        $customerId = $crm->convertLeadToCustomer($bizId, $leadId);
        logAudit('lead.converted_to_customer', $bizId, ['lead_id' => $leadId, 'customer_id' => $customerId]);
        jsonResponse(['customer_id' => $customerId], 200, 'Lead converted to customer successfully.');
    }
}

// Handle PUT / PATCH: Update Lead
if ($method === 'PUT' || $method === 'PATCH') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $leadId = (int)($input['id'] ?? $_GET['id'] ?? 0);
    $db = Database::getInstance();

    $lead = $db->fetchOne("SELECT * FROM leads WHERE id = ? AND business_id = ?", [$leadId, $bizId]);
    if (!$lead) {
        jsonResponse(null, 404, 'Lead not found.');
    }

    $updateData = [];
    $allowed = ['name', 'email', 'phone', 'company', 'title', 'location', 'requirement', 'estimated_value', 'status_id', 'priority', 'next_followup_date', 'assigned_user_id'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $input)) {
            $updateData[$f] = $input[$f];
        }
    }

    if (!empty($updateData)) {
        $updateData['updated_at'] = date('Y-m-d H:i:s');
        $db->update('leads', $updateData, 'id = ?', [$leadId]);
        logAudit('lead.updated', $bizId, ['lead_id' => $leadId, 'fields' => array_keys($updateData)]);
    }

    $updated = $db->fetchOne("SELECT * FROM leads WHERE id = ?", [$leadId]);
    jsonResponse($updated, 200, 'Lead updated.');
}

// Handle DELETE: Soft Delete Lead
if ($method === 'DELETE') {
    $leadId = (int)($_GET['id'] ?? 0);
    $db = Database::getInstance();
    $db->update('leads', ['deleted_at' => date('Y-m-d H:i:s')], 'id = ? AND business_id = ?', [$leadId, $bizId]);
    logAudit('lead.deleted', $bizId, ['lead_id' => $leadId]);
    jsonResponse(null, 200, 'Lead deleted.');
}
