<?php
/**
 * Onboarding Wizard Endpoint
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config.php';

$user = AuthMiddleware::requireAuth();
$userId = (int)$user['id'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(null, 405, 'Method Not Allowed');
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$step = (int)($input['step'] ?? 1);
$db = Database::getInstance();

$bizId = currentBusinessId();

if ($step === 1) {
    // Step 1: Personal info
    $fullName = trim($input['full_name'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $db->update('users', ['full_name' => $fullName, 'phone' => $phone], 'id = ?', [$userId]);
    $_SESSION['user']['full_name'] = $fullName;

    jsonResponse(['step' => 1, 'success' => true]);
}

if ($step === 2) {
    // Step 2: Business info
    $name = trim($input['business_name'] ?? 'My Business');
    $industry = trim($input['industry'] ?? 'Technology & Services');
    $website = trim($input['website'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $currency = trim($input['currency'] ?? 'INR');
    $symbol = $currency === 'INR' ? '₹' : ($currency === 'USD' ? '$' : '€');
    $timezone = trim($input['timezone'] ?? 'Asia/Kolkata');

    if ($bizId) {
        $db->update('businesses', [
            'name' => $name,
            'industry' => $industry,
            'website' => $website,
            'phone' => $phone,
            'currency' => $currency,
            'currency_symbol' => $symbol,
            'timezone' => $timezone
        ], 'id = ?', [$bizId]);
    } else {
        $bizSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name))) . '-' . rand(100, 999);
        $bizId = $db->insert('businesses', [
            'owner_id' => $userId,
            'name' => $name,
            'slug' => $bizSlug,
            'industry' => $industry,
            'website' => $website,
            'phone' => $phone,
            'currency' => $currency,
            'currency_symbol' => $symbol,
            'timezone' => $timezone,
            'status' => 'active'
        ]);

        $db->insert('business_members', [
            'business_id' => $bizId,
            'user_id' => $userId,
            'role_id' => 3,
            'status' => 'active'
        ]);

        $db->insert('usage_limits', [
            'business_id' => $bizId,
            'ai_credits_limit' => 150,
            'leads_limit' => 200,
            'team_members_limit' => 3
        ]);
    }

    $_SESSION['active_business'] = [
        'id' => $bizId,
        'name' => $name,
        'currency' => $currency,
        'currency_symbol' => $symbol,
        'role_id' => 3
    ];

    jsonResponse(['step' => 2, 'business_id' => $bizId]);
}

if ($step === 3 && $bizId) {
    // Step 3: Business description & USP
    $about = trim($input['about'] ?? '');
    $usp = trim($input['usp'] ?? '');
    $target = trim($input['target_audience'] ?? '');

    $db->update('businesses', [
        'about' => $about,
        'usp' => $usp,
        'target_audience' => $target
    ], 'id = ?', [$bizId]);

    // Index into Knowledge Base
    if ($about || $usp) {
        $knowledge = new KnowledgeService();
        $knowledge->addSource($bizId, 'manual', 'Company Overview & USPs', "About: {$about}\nUSPs: {$usp}\nTarget Audience: {$target}");
    }

    jsonResponse(['step' => 3, 'success' => true]);
}

if ($step === 4 && $bizId) {
    // Step 4: FAQs
    $faqs = $input['faqs'] ?? [];
    if (is_array($faqs)) {
        $knowledge = new KnowledgeService();
        foreach ($faqs as $faq) {
            if (!empty($faq['question']) && !empty($faq['answer'])) {
                $db->insert('business_faqs', [
                    'business_id' => $bizId,
                    'question' => trim($faq['question']),
                    'answer' => trim($faq['answer']),
                    'category' => 'General'
                ]);
                $knowledge->addSource($bizId, 'faq', "FAQ: " . $faq['question'], $faq['answer']);
            }
        }
    }

    jsonResponse(['step' => 4, 'success' => true]);
}

if ($step === 5 && $bizId) {
    // Step 5: AI Configuration
    $tone = trim($input['ai_tone'] ?? 'Professional');
    $lang = trim($input['ai_primary_language'] ?? 'English');

    $db->query(
        "INSERT INTO business_settings (business_id, ai_tone, ai_primary_language, updated_at) 
         VALUES (?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE ai_tone = VALUES(ai_tone), ai_primary_language = VALUES(ai_primary_language)",
        [$bizId, $tone, $lang]
    );

    jsonResponse(['step' => 5, 'success' => true]);
}

if ($step === 6 && $bizId) {
    // Step 6: Plan choice
    $planId = (int)($input['plan_id'] ?? 1);
    $billing = new BillingService();
    $subResult = $billing->upgradePlan($bizId, $planId);

    jsonResponse(['step' => 6, 'subscription' => $subResult, 'completed' => true]);
}

jsonResponse(['completed' => true]);
