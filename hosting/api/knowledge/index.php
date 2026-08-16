<?php
/**
 * Knowledge Base Sources API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$auth = AuthMiddleware::requireApiAuth();
$bizId = PermissionMiddleware::enforceBusinessTenant();
$service = new KnowledgeService();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sources = $service->getSources($bizId);
    jsonResponse(['sources' => $sources, 'total' => count($sources)]);
}

if ($method === 'POST') {
    // Handle File Upload or Text/FAQ/URL Addition
    if (!empty($_FILES['document'])) {
        $sourceId = $service->uploadDocument($bizId, $_FILES['document']);
        logAudit('knowledge.uploaded', $bizId, ['source_id' => $sourceId, 'file' => $_FILES['document']['name']]);
        jsonResponse(['id' => $sourceId], 201, 'Document uploaded and indexed into AI Knowledge Base.');
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $type = $input['type'] ?? 'manual';
    $title = trim($input['title'] ?? 'Knowledge Note');
    $content = trim($input['content'] ?? '');
    $url = trim($input['url'] ?? '');

    if (empty($content) && empty($url)) {
        jsonResponse(null, 422, 'Content or URL is required.');
    }

    $sourceId = $service->addSource($bizId, $type, $title, $content, $url);
    logAudit('knowledge.added', $bizId, ['source_id' => $sourceId, 'title' => $title, 'type' => $type]);

    jsonResponse(['id' => $sourceId], 201, 'Knowledge source indexed successfully.');
}

if ($method === 'DELETE') {
    $sourceId = (int)($_GET['id'] ?? 0);
    $db = Database::getInstance();
    $db->delete('knowledge_chunks', 'source_id = ? AND business_id = ?', [$sourceId, $bizId]);
    $db->delete('knowledge_sources', 'id = ? AND business_id = ?', [$sourceId, $bizId]);
    logAudit('knowledge.deleted', $bizId, ['source_id' => $sourceId]);
    jsonResponse(null, 200, 'Knowledge source deleted.');
}
