<?php
/**
 * AI Assistant Chat Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$auth = AuthMiddleware::requireApiAuth();
$bizId = PermissionMiddleware::enforceBusinessTenant();
$userId = currentUserId() ?? 1;
$db = Database::getInstance();
$ai = new AIService();
$method = $_SERVER['REQUEST_METHOD'];

// Handle GET: List Conversations & Messages
if ($method === 'GET') {
    $convId = (int)($_GET['conversation_id'] ?? 0);

    if ($convId) {
        $conv = $db->fetchOne("SELECT * FROM ai_conversations WHERE id = ? AND business_id = ?", [$convId, $bizId]);
        if (!$conv) {
            jsonResponse(null, 404, 'Conversation not found.');
        }
        $messages = $db->fetchAll("SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY id ASC", [$convId]);
        jsonResponse(['conversation' => $conv, 'messages' => $messages]);
    }

    $conversations = $db->fetchAll(
        "SELECT c.*, (SELECT content FROM ai_messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message 
         FROM ai_conversations c 
         WHERE c.business_id = ? AND c.user_id = ? 
         ORDER BY c.updated_at DESC",
        [$bizId, $userId]
    );

    jsonResponse(['conversations' => $conversations]);
}

// Handle POST: Send Message / Start New Conversation
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $message = trim($input['message'] ?? '');
    $convId = !empty($input['conversation_id']) ? (int)$input['conversation_id'] : null;

    if (empty($message)) {
        jsonResponse(null, 422, 'Message cannot be empty.');
    }

    // 1. Create or retrieve conversation
    if (!$convId) {
        $title = mb_substr($message, 0, 40) . (mb_strlen($message) > 40 ? '...' : '');
        $convId = $db->insert('ai_conversations', [
            'business_id' => $bizId,
            'user_id' => $userId,
            'title' => $title,
            'context_type' => 'business_assistant'
        ]);
    }

    // 2. Save User Message
    $db->insert('ai_messages', [
        'conversation_id' => $convId,
        'role' => 'user',
        'content' => $message
    ]);

    // 3. Load conversation context messages
    $historyRows = $db->fetchAll("SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 10", [$convId]);
    $formattedHistory = [];
    foreach ($historyRows as $row) {
        $formattedHistory[] = [
            'role' => $row['role'],
            'content' => $row['content']
        ];
    }

    // 4. Call AI Service (Gemini with Knowledge RAG)
    $response = $ai->chat($formattedHistory, $bizId, ['feature' => 'business_assistant']);

    if (!$response['success']) {
        jsonResponse(null, 500, $response['error'] ?? 'AI Service failed to generate response.');
    }

    $aiText = $response['text'];

    // 5. Save Assistant Reply
    $msgId = $db->insert('ai_messages', [
        'conversation_id' => $convId,
        'role' => 'assistant',
        'content' => $aiText,
        'tokens_used' => ($response['prompt_tokens'] ?? 0) + ($response['completion_tokens'] ?? 0),
        'model_used' => $response['model'] ?? 'gemini-3.7-flash'
    ]);

    // Update conversation timestamp
    $db->update('ai_conversations', ['updated_at' => date('Y-m-d H:i:s')], 'id = ?', [$convId]);

    jsonResponse([
        'conversation_id' => $convId,
        'message_id' => $msgId,
        'reply' => $aiText,
        'citations' => $response['citations'] ?? [],
        'provider' => $response['provider'] ?? 'gemini',
        'model' => $response['model'] ?? 'gemini-3.7-flash',
        'tokens' => [
            'prompt' => $response['prompt_tokens'],
            'completion' => $response['completion_tokens'],
            'total' => $response['prompt_tokens'] + $response['completion_tokens']
        ]
    ]);
}

// Handle DELETE: Delete Conversation
if ($method === 'DELETE') {
    $convId = (int)($_GET['conversation_id'] ?? 0);
    $db->delete('ai_messages', 'conversation_id = ?', [$convId]);
    $db->delete('ai_conversations', 'id = ? AND business_id = ?', [$convId, $bizId]);
    jsonResponse(null, 200, 'Conversation deleted.');
}
