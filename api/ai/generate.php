<?php
/**
 * AI Tool Suite Generators Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$auth = AuthMiddleware::requireApiAuth();
$bizId = PermissionMiddleware::enforceBusinessTenant();
$db = Database::getInstance();
$ai = new AIService();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(null, 405, 'Method Not Allowed');
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$tool = $input['tool'] ?? $_GET['tool'] ?? '';

if (empty($tool)) {
    jsonResponse(null, 422, 'Generator tool name is required (e.g. proposal, review_reply, social_post, seo_content, email).');
}

// 1. Tool: Review Reply
if ($tool === 'review_reply') {
    $reviewText = trim($input['review_text'] ?? '');
    $rating = (int)($input['rating'] ?? 5);
    $tone = trim($input['tone'] ?? 'professional');

    if (empty($reviewText)) {
        jsonResponse(null, 422, 'Review text is required.');
    }

    $res = $ai->generateReviewReply($reviewText, $rating, $tone);
    if (!$res['success']) {
        jsonResponse(null, 500, $res['error']);
    }

    jsonResponse(['reply' => $res['text'], 'provider' => $res['provider']]);
}

// 2. Tool: Social Post
if ($tool === 'social_post') {
    $topic = trim($input['topic'] ?? '');
    $platform = trim($input['platform'] ?? 'LinkedIn');
    $tone = trim($input['tone'] ?? 'engaging');
    $cta = trim($input['cta'] ?? '');

    if (empty($topic)) {
        jsonResponse(null, 422, 'Topic is required.');
    }

    $res = $ai->generateSocialPost($topic, $platform, $tone, $cta);
    if (!$res['success']) {
        jsonResponse(null, 500, $res['error']);
    }

    // Save in social_posts
    $db->insert('social_posts', [
        'business_id' => $bizId,
        'user_id' => currentUserId(),
        'platform' => strtolower($platform),
        'content' => $res['text'],
        'status' => 'draft'
    ]);

    jsonResponse(['content' => $res['text'], 'platform' => $platform]);
}

// 3. Tool: SEO Content
if ($tool === 'seo_content') {
    $keyword = trim($input['keyword'] ?? '');
    $secondary = trim($input['secondary_keywords'] ?? '');
    $intent = trim($input['intent'] ?? 'Informational');
    $country = trim($input['country'] ?? 'India');

    if (empty($keyword)) {
        jsonResponse(null, 422, 'Target keyword is required.');
    }

    $res = $ai->generateSEOContent($keyword, $secondary, $intent, $country);
    if (!$res['success']) {
        jsonResponse(null, 500, $res['error']);
    }

    $data = $res['data'];
    $db->insert('seo_content', [
        'business_id' => $bizId,
        'title' => $data['seo_title'] ?? $keyword,
        'slug' => $data['slug'] ?? 'article',
        'meta_description' => $data['meta_description'] ?? '',
        'content_markdown' => $data['article_markdown'] ?? '',
        'status' => 'draft'
    ]);

    jsonResponse($data);
}

// 4. Tool: Proposal Generator
if ($tool === 'proposal') {
    $leadId = !empty($input['lead_id']) ? (int)$input['lead_id'] : null;
    $lead = $leadId ? $db->fetchOne("SELECT * FROM leads WHERE id = ? AND business_id = ?", [$leadId, $bizId]) : [];
    $biz = $db->fetchOne("SELECT * FROM businesses WHERE id = ?", [$bizId]);
    $services = $db->fetchAll("SELECT * FROM business_services WHERE business_id = ?", [$bizId]);

    $res = $ai->generateProposal($lead ?: $input, $biz ?: [], $services);
    if (!$res['success']) {
        jsonResponse(null, 500, $res['error']);
    }

    jsonResponse(['proposal_text' => $res['text']]);
}

// 5. Tool: Email Generator
if ($tool === 'email') {
    $purpose = trim($input['purpose'] ?? 'Follow up regarding proposal');
    $recipient = trim($input['recipient_name'] ?? 'Valued Client');
    $prompt = "Write a high-converting, polite business email.\nPurpose: {$purpose}\nRecipient Name: {$recipient}\nInclude a clear call to action and subject line.";
    $res = $ai->generateText($prompt, "You are an executive business communications specialist.", ['feature' => 'email_tool']);

    if (!$res['success']) {
        jsonResponse(null, 500, $res['error']);
    }

    jsonResponse(['email_text' => $res['text']]);
}

jsonResponse(null, 400, 'Unknown tool requested.');
