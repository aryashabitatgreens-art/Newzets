<?php
/**
 * Public Embeddable AI Chatbot API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

// Enable CORS for embeddable widget
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-BharatAI-Widget-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db = Database::getInstance();
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$bizId = (int)($_GET['business_id'] ?? $input['business_id'] ?? 1);

$business = $db->fetchOne("SELECT id, name, industry, currency, currency_symbol FROM businesses WHERE id = ? AND deleted_at IS NULL", [$bizId]);
if (!$business) {
    jsonResponse(null, 404, 'Business chatbot not found.');
}

// 1. Action: Get Chatbot Configuration
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $settings = $db->fetchOne("SELECT * FROM business_settings WHERE business_id = ?", [$bizId]);
    jsonResponse([
        'business_name' => $business['name'],
        'welcome_message' => "Hi! I am the AI assistant for {$business['name']}. How can I assist you with your business today?",
        'primary_color' => '#4f46e5',
        'require_lead_capture' => true
    ]);
}

// 2. Action: Chat with Bot
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $input['action'] ?? 'chat';

    if ($action === 'capture_lead') {
        $name = trim($input['name'] ?? 'Web Visitor');
        $email = trim($input['email'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $req = trim($input['requirement'] ?? 'Inquiry via Website AI Chatbot');

        $crm = new CRMService();
        $leadId = $crm->createLead($bizId, [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'requirement' => $req,
            'source_id' => 2 // Chatbot source
        ]);

        jsonResponse(['lead_id' => $leadId, 'message' => 'Thank you! Our team will get back to you shortly.']);
    }

    $message = trim($input['message'] ?? '');
    if (empty($message)) {
        jsonResponse(null, 422, 'Message is required.');
    }

    $history = $input['history'] ?? [];
    $formatted = [];
    foreach ($history as $h) {
        $formatted[] = ['role' => $h['role'] ?? 'user', 'content' => $h['content'] ?? ''];
    }
    $formatted[] = ['role' => 'user', 'content' => $message];

    $ai = new AIService();
    $res = $ai->chat($formatted, $bizId, ['feature' => 'website_chatbot']);

    if (!$res['success']) {
        jsonResponse(['reply' => 'I apologize, I am temporarily unable to answer right now. Please leave your contact details so our team can connect with you!']);
    }

    jsonResponse([
        'reply' => $res['text'],
        'citations' => $res['citations'] ?? []
    ]);
}
