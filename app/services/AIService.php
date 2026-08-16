<?php
/**
 * AI Provider Manager & Unified Router
 * Supports Google Gemini, OpenAI, Anthropic, and Custom OpenAI-compatible API
 */

declare(strict_types=1);

class AIService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Unified Chat method with Knowledge RAG Context
     */
    public function chat(array $messages, ?int $businessId = null, array $options = []): array {
        $businessId = $businessId ?? currentBusinessId();
        $userQuery = end($messages)['content'] ?? '';

        // 1. Fetch Business Knowledge & RAG Chunks
        $contextText = "";
        $citations = [];
        if ($businessId) {
            $ragResult = $this->retrieveKnowledgeContext($businessId, $userQuery);
            $contextText = $ragResult['context'];
            $citations = $ragResult['citations'];
        }

        // 2. Build System Prompt with Business Context
        $systemPrompt = "You are the AI Business Assistant for BharatAI Business OS.\n";
        if ($businessId) {
            $biz = $this->db->fetchOne("SELECT b.*, bs.ai_tone, bs.ai_primary_language FROM businesses b LEFT JOIN business_settings bs ON bs.business_id = b.id WHERE b.id = ?", [$businessId]);
            if ($biz) {
                $tone = $biz['ai_tone'] ?? 'professional and helpful';
                $lang = $biz['ai_primary_language'] ?? 'English';
                $systemPrompt .= "Business Name: {$biz['name']}\nIndustry: {$biz['industry']}\nAbout: {$biz['about']}\nUSP: {$biz['usp']}\nTarget Audience: {$biz['target_audience']}\nTone: {$tone}\nPrimary Language: {$lang}\n";
            }
        }

        if (!empty($contextText)) {
            $systemPrompt .= "\n--- VERIFIED BUSINESS KNOWLEDGE BASE ---\n" . $contextText . "\n--- END KNOWLEDGE BASE ---\nUse the knowledge base to answer accurately. If unsure, offer to connect with human staff.";
        }

        // 3. Check credits before execution
        if ($businessId) {
            $this->checkUsageLimit($businessId);
        }

        // 4. Execute AI Generation with Fallback Router
        $startTime = microtime(true);
        $result = $this->executeWithFallback(function($provider, $model) use ($messages, $systemPrompt, $options) {
            return $this->callProviderChat($provider, $model, $messages, $systemPrompt, $options);
        }, $options['model'] ?? null);

        $durationMs = (int)((microtime(true) - $startTime) * 1000);

        // 5. Track Usage in Database
        if ($businessId && $result['success']) {
            $this->recordUsage(
                $businessId,
                $result['provider'],
                $result['model'],
                $options['feature'] ?? 'chat_assistant',
                $result['prompt_tokens'],
                $result['completion_tokens'],
                $result['estimated_cost'],
                $durationMs,
                'success'
            );
        }

        $result['citations'] = $citations;
        return $result;
    }

    /**
     * Generate Structured / Freeform Text with System Instruction
     */
    public function generateText(string $prompt, string $systemInstruction = '', array $options = []): array {
        $businessId = $options['business_id'] ?? currentBusinessId();
        if ($businessId) {
            $this->checkUsageLimit($businessId);
        }

        $startTime = microtime(true);
        $result = $this->executeWithFallback(function($provider, $model) use ($prompt, $systemInstruction, $options) {
            return $this->callProviderGenerate($provider, $model, $prompt, $systemInstruction, $options);
        }, $options['model'] ?? null);

        $durationMs = (int)((microtime(true) - $startTime) * 1000);

        if ($businessId && $result['success']) {
            $this->recordUsage(
                $businessId,
                $result['provider'],
                $result['model'],
                $options['feature'] ?? 'text_generation',
                $result['prompt_tokens'],
                $result['completion_tokens'],
                $result['estimated_cost'],
                $durationMs,
                'success'
            );
        }

        return $result;
    }

    /**
     * AI Lead Qualification Engine
     */
    public function qualifyLead(array $leadData): array {
        $prompt = "Analyze this incoming sales lead and provide qualification metrics in JSON format.\n"
                . "Lead Name: " . ($leadData['name'] ?? 'N/A') . "\n"
                . "Company: " . ($leadData['company'] ?? 'N/A') . "\n"
                . "Requirement: " . ($leadData['requirement'] ?? 'N/A') . "\n"
                . "Estimated Value: " . ($leadData['estimated_value'] ?? 'N/A') . "\n"
                . "Source: " . ($leadData['source_name'] ?? 'N/A') . "\n"
                . "Location: " . ($leadData['location'] ?? 'N/A') . "\n"
                . "\nRequired JSON fields:\n"
                . "- score: (number between 0 and 100)\n"
                . "- intent: (string, e.g. High Purchase Intent, Exploratory, Price Sensitive)\n"
                . "- buying_probability: (string, e.g. 85%, High, Medium, Low)\n"
                . "- priority: (string: low, medium, high, urgent)\n"
                . "- summary: (2-sentence executive summary of lead)\n"
                . "- recommended_action: (clear action step for salesperson)\n"
                . "- suggested_response: (customized professional email or WhatsApp message to reply immediately)";

        $system = "You are an expert sales operations lead qualification AI. Output ONLY valid JSON.";
        $res = $this->generateText($prompt, $system, ['feature' => 'lead_qualification']);

        if (!$res['success']) {
            return $res;
        }

        $cleaned = trim($res['text']);
        $cleaned = preg_replace('/^```json\s*|\s*```$/m', '', $cleaned);
        $parsed = json_decode($cleaned, true);

        if (!$parsed) {
            // Fallback parsing
            $parsed = [
                'score' => 75,
                'intent' => 'Qualified Interest',
                'buying_probability' => 'Medium-High',
                'priority' => 'high',
                'summary' => $res['text'],
                'recommended_action' => 'Schedule a discovery call within 24 hours.',
                'suggested_response' => 'Hello ' . ($leadData['name'] ?? 'there') . ', thank you for reaching out! We would love to discuss your requirements.'
            ];
        }

        return [
            'success' => true,
            'data' => $parsed,
            'raw' => $res['text']
        ];
    }

    /**
     * AI Proposal Generation
     */
    public function generateProposal(array $leadData, array $bizData, array $services = []): array {
        $prompt = "Generate a comprehensive, client-ready business proposal.\n"
                . "Client Name: " . ($leadData['name'] ?? 'Prospective Client') . "\n"
                . "Company: " . ($leadData['company'] ?? 'Client Org') . "\n"
                . "Client Requirement: " . ($leadData['requirement'] ?? 'AI Automation and System Integration') . "\n"
                . "Our Business Name: " . ($bizData['name'] ?? 'Bharat Automation') . "\n"
                . "About Us: " . ($bizData['about'] ?? 'Leading automation solutions provider') . "\n"
                . "Our Services: " . json_encode($services) . "\n"
                . "\nFormat the proposal with structured sections: Introduction, Problem Statement, Proposed Solution, Scope of Work, Deliverables, Timeline, and Terms.";

        $system = "You are a senior enterprise SaaS & proposal architect. Generate persuasive, well-structured business proposals.";
        return $this->generateText($prompt, $system, ['feature' => 'proposal_generation']);
    }

    /**
     * AI Review Reply Assistant
     */
    public function generateReviewReply(string $reviewText, int $rating, string $tone = 'professional'): array {
        $prompt = "Generate a professional, high-conversion customer review reply.\n"
                . "Customer Review: \"{$reviewText}\"\n"
                . "Star Rating: {$rating}/5\n"
                . "Tone: {$tone}\n"
                . "Requirements: Address the reviewer graciously. If negative, apologize calmly and provide contact for resolution. If positive, express gratitude and reinforce brand value.";

        $system = "You are a customer experience and reputation management specialist.";
        return $this->generateText($prompt, $system, ['feature' => 'review_reply']);
    }

    /**
     * AI Social Media Post Generator
     */
    public function generateSocialPost(string $topic, string $platform, string $tone = 'engaging', string $cta = ''): array {
        $prompt = "Generate a viral, high-engagement social media post for {$platform}.\n"
                . "Topic: {$topic}\n"
                . "Tone: {$tone}\n"
                . "Call To Action: " . ($cta ?: 'Leave a comment or visit our website') . "\n"
                . "Provide: Hook, Body Text, Bullet Points (if relevant), Call to Action, and 5-8 relevant trending hashtags.";

        $system = "You are a digital marketing and copywriter expert.";
        return $this->generateText($prompt, $system, ['feature' => 'social_generator']);
    }

    /**
     * AI SEO Content Article Generator
     */
    public function generateSEOContent(string $targetKeyword, string $secondaryKeywords, string $intent = 'Informational', string $country = 'India'): array {
        $prompt = "Generate an in-depth, rankable SEO article.\n"
                . "Primary Keyword: {$targetKeyword}\n"
                . "Secondary Keywords: {$secondaryKeywords}\n"
                . "Search Intent: {$intent}\n"
                . "Target Audience Country: {$country}\n"
                . "\nProvide the output in valid JSON with fields: seo_title, meta_description, slug, outline (array of strings), article_markdown (full formatted article with H2/H3 headers), faqs (array of question and answer objects).";

        $system = "You are a top-tier SEO content strategist. Output valid JSON only.";
        $res = $this->generateText($prompt, $system, ['feature' => 'seo_tool']);

        if (!$res['success']) {
            return $res;
        }

        $cleaned = trim($res['text']);
        $cleaned = preg_replace('/^```json\s*|\s*```$/m', '', $cleaned);
        $parsed = json_decode($cleaned, true);

        if (!$parsed) {
            $parsed = [
                'seo_title' => "Complete Guide to {$targetKeyword} (2026)",
                'meta_description' => "Learn everything about {$targetKeyword} with actionable insights, best practices, and expert advice.",
                'slug' => strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $targetKeyword))),
                'outline' => ["Introduction to {$targetKeyword}", "Key Benefits", "Implementation Steps", "Frequently Asked Questions"],
                'article_markdown' => $res['text'],
                'faqs' => [
                    ['question' => "What is {$targetKeyword}?", 'answer' => "A comprehensive approach to automating workflows."]
                ]
            ];
        }

        return [
            'success' => true,
            'data' => $parsed
        ];
    }

    /**
     * Retrieve Knowledge Base Context for RAG Search
     */
    private function retrieveKnowledgeContext(int $businessId, string $query): array {
        $words = array_filter(explode(' ', preg_replace('/[^\w\s]/', '', $query)), fn($w) => strlen($w) > 2);
        if (empty($words)) {
            $chunks = $this->db->fetchAll("SELECT content, title FROM knowledge_chunks WHERE business_id = ? LIMIT 3", [$businessId]);
        } else {
            $likeClauses = [];
            $params = [$businessId];
            foreach (array_slice($words, 0, 5) as $word) {
                $likeClauses[] = "content LIKE ?";
                $params[] = "%{$word}%";
            }
            $sql = "SELECT content, title FROM knowledge_chunks WHERE business_id = ? AND (" . implode(' OR ', $likeClauses) . ") LIMIT 4";
            $chunks = $this->db->fetchAll($sql, $params);
            if (empty($chunks)) {
                $chunks = $this->db->fetchAll("SELECT content, title FROM knowledge_chunks WHERE business_id = ? LIMIT 3", [$businessId]);
            }
        }

        $contextLines = [];
        $citations = [];
        foreach ($chunks as $chunk) {
            $contextLines[] = "- " . $chunk['content'];
            if (!empty($chunk['title'])) {
                $citations[] = $chunk['title'];
            }
        }

        return [
            'context' => implode("\n\n", $contextLines),
            'citations' => array_values(array_unique($citations))
        ];
    }

    /**
     * Fallback Router across configured providers
     */
    private function executeWithFallback(callable $caller, ?string $preferredModel = null): array {
        $providers = $this->db->fetchAll("SELECT * FROM ai_providers WHERE is_enabled = 1 ORDER BY priority ASC");

        if (empty($providers)) {
            // Default built-in provider fallback using environment keys
            $providers = [
                ['slug' => 'gemini', 'name' => 'Google Gemini AI', 'is_enabled' => 1, 'base_url' => 'https://generativelanguage.googleapis.com/v1beta']
            ];
        }

        $lastError = "No AI providers configured or available.";

        foreach ($providers as $provider) {
            $slug = $provider['slug'];
            $models = $this->db->fetchAll("SELECT * FROM ai_models WHERE provider_id = ? AND is_active = 1 ORDER BY is_fallback ASC", [$provider['id'] ?? 0]);

            if (empty($models)) {
                $models = [['model_identifier' => $preferredModel ?: ($slug === 'gemini' ? 'gemini-3.7-flash' : 'gpt-4o-mini')]];
            }

            foreach ($models as $modelRecord) {
                $model = $preferredModel ?: $modelRecord['model_identifier'];
                try {
                    $result = $caller($provider, $model);
                    if ($result['success']) {
                        $result['provider'] = $slug;
                        $result['model'] = $model;
                        return $result;
                    }
                    $lastError = $result['error'] ?? "Unknown provider error.";
                } catch (\Throwable $e) {
                    $lastError = $e->getMessage();
                    logSystem('warning', 'ai', "AI Provider {$slug} failed: " . $e->getMessage(), ['provider' => $slug, 'model' => $model]);
                }
            }
        }

        return [
            'success' => false,
            'text' => '',
            'error' => "AI Generation Failed: {$lastError}. Please check API Key in Admin > AI Providers or server configuration.",
            'prompt_tokens' => 0,
            'completion_tokens' => 0,
            'estimated_cost' => 0.00
        ];
    }

    /**
     * Provider Callers (Gemini, OpenAI, Anthropic)
     */
    private function callProviderChat(array $provider, string $model, array $messages, string $systemPrompt, array $options): array {
        $slug = $provider['slug'] ?? 'gemini';

        if ($slug === 'gemini') {
            return $this->callGeminiApi($model, $messages, $systemPrompt, $options);
        } elseif ($slug === 'openai' || $slug === 'custom') {
            return $this->callOpenAIApi($provider, $model, $messages, $systemPrompt, $options);
        } elseif ($slug === 'anthropic') {
            return $this->callAnthropicApi($provider, $model, $messages, $systemPrompt, $options);
        }

        return ['success' => false, 'error' => "Unsupported AI provider: {$slug}"];
    }

    private function callProviderGenerate(array $provider, string $model, string $prompt, string $systemPrompt, array $options): array {
        $messages = [
            ['role' => 'user', 'content' => $prompt]
        ];
        return $this->callProviderChat($provider, $model, $messages, $systemPrompt, $options);
    }

    /**
     * Native Google Gemini REST API Integration
     */
    private function callGeminiApi(string $model, array $messages, string $systemPrompt, array $options): array {
        $apiKey = env('GEMINI_API_KEY');
        if (empty($apiKey)) {
            return ['success' => false, 'error' => 'GEMINI_API_KEY is not configured in server environment or Settings.'];
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        // Format contents array
        $contents = [];
        foreach ($messages as $msg) {
            $contents[] = [
                'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]]
            ];
        }

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => (float)($options['temperature'] ?? 0.7),
                'maxOutputTokens' => (int)($options['max_tokens'] ?? 4096)
            ]
        ];

        if (!empty($systemPrompt)) {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $systemPrompt]]
            ];
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'User-Agent: aistudio-build'
            ],
            CURLOPT_TIMEOUT => 45
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return ['success' => false, 'error' => "Gemini cURL Error: {$curlError}"];
        }

        $json = json_decode((string)$response, true);
        if ($httpCode !== 200 || isset($json['error'])) {
            $errMsg = $json['error']['message'] ?? "HTTP {$httpCode}: " . substr((string)$response, 0, 150);
            return ['success' => false, 'error' => "Gemini API Error: {$errMsg}"];
        }

        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $promptTokens = $json['usageMetadata']['promptTokenCount'] ?? 0;
        $completionTokens = $json['usageMetadata']['candidatesTokenCount'] ?? 0;

        return [
            'success' => true,
            'text' => $text,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $completionTokens,
            'estimated_cost' => ($promptTokens * 0.0000001) + ($completionTokens * 0.0000004)
        ];
    }

    /**
     * OpenAI / Custom Compatible API
     */
    private function callOpenAIApi(array $provider, string $model, array $messages, string $systemPrompt, array $options): array {
        $apiKey = env('OPENAI_API_KEY');
        $baseUrl = rtrim($provider['base_url'] ?? 'https://api.openai.com/v1', '/');
        if (empty($apiKey) && $provider['slug'] === 'openai') {
            return ['success' => false, 'error' => 'OPENAI_API_KEY is not configured.'];
        }

        $formatted = [];
        if (!empty($systemPrompt)) {
            $formatted[] = ['role' => 'system', 'content' => $systemPrompt];
        }
        foreach ($messages as $msg) {
            $formatted[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }

        $payload = [
            'model' => $model,
            'messages' => $formatted,
            'temperature' => (float)($options['temperature'] ?? 0.7),
            'max_tokens' => (int)($options['max_tokens'] ?? 2048)
        ];

        $ch = curl_init("{$baseUrl}/chat/completions");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer {$apiKey}"
            ],
            CURLOPT_TIMEOUT => 45
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return ['success' => false, 'error' => "OpenAI cURL Error: {$curlError}"];
        }

        $json = json_decode((string)$response, true);
        if ($httpCode !== 200 || isset($json['error'])) {
            $errMsg = $json['error']['message'] ?? "HTTP {$httpCode}";
            return ['success' => false, 'error' => "OpenAI Error: {$errMsg}"];
        }

        $text = $json['choices'][0]['message']['content'] ?? '';
        $promptTokens = $json['usage']['prompt_tokens'] ?? 0;
        $completionTokens = $json['usage']['completion_tokens'] ?? 0;

        return [
            'success' => true,
            'text' => $text,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $completionTokens,
            'estimated_cost' => ($promptTokens * 0.00000015) + ($completionTokens * 0.0000006)
        ];
    }

    /**
     * Anthropic Claude API
     */
    private function callAnthropicApi(array $provider, string $model, array $messages, string $systemPrompt, array $options): array {
        $apiKey = env('ANTHROPIC_API_KEY');
        if (empty($apiKey)) {
            return ['success' => false, 'error' => 'ANTHROPIC_API_KEY is not configured.'];
        }

        $formatted = [];
        foreach ($messages as $msg) {
            if ($msg['role'] !== 'system') {
                $formatted[] = ['role' => $msg['role'], 'content' => $msg['content']];
            }
        }

        $payload = [
            'model' => $model,
            'messages' => $formatted,
            'max_tokens' => (int)($options['max_tokens'] ?? 4096),
            'temperature' => (float)($options['temperature'] ?? 0.7)
        ];

        if (!empty($systemPrompt)) {
            $payload['system'] = $systemPrompt;
        }

        $ch = curl_init("https://api.anthropic.com/v1/messages");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "x-api-key: {$apiKey}",
                'anthropic-version: 2023-06-01'
            ],
            CURLOPT_TIMEOUT => 45
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode((string)$response, true);
        if ($httpCode !== 200 || isset($json['error'])) {
            $errMsg = $json['error']['message'] ?? "HTTP {$httpCode}";
            return ['success' => false, 'error' => "Anthropic Error: {$errMsg}"];
        }

        $text = $json['content'][0]['text'] ?? '';
        $promptTokens = $json['usage']['input_tokens'] ?? 0;
        $completionTokens = $json['usage']['output_tokens'] ?? 0;

        return [
            'success' => true,
            'text' => $text,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $completionTokens,
            'estimated_cost' => ($promptTokens * 0.000003) + ($completionTokens * 0.000015)
        ];
    }

    /**
     * Check usage limits for the active business
     */
    private function checkUsageLimit(int $businessId): void {
        $limits = $this->db->fetchOne("SELECT * FROM usage_limits WHERE business_id = ?", [$businessId]);
        if ($limits) {
            $used = (int)($limits['ai_credits_used'] ?? 0);
            $max = (int)($limits['ai_credits_limit'] ?? 100);
            if ($used >= $max && $max > 0) {
                throw new RuntimeException("AI Credit Limit Reached ({$used}/{$max}). Please upgrade your plan in Billing.");
            }
        }
    }

    /**
     * Record AI Usage and Deduct Credits
     */
    private function recordUsage(int $businessId, string $provider, string $model, string $feature, int $promptTokens, int $compTokens, float $cost, int $timeMs, string $status): void {
        $totalTokens = $promptTokens + $compTokens;
        $userId = currentUserId();

        $this->db->insert('ai_usage', [
            'business_id' => $businessId,
            'user_id' => $userId,
            'provider_slug' => $provider,
            'model_identifier' => $model,
            'feature' => $feature,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $compTokens,
            'total_tokens' => $totalTokens,
            'estimated_cost' => $cost,
            'request_time_ms' => $timeMs,
            'status' => $status
        ]);

        // Increment credits used in usage_limits
        $this->db->query(
            "UPDATE usage_limits SET ai_credits_used = ai_credits_used + 1 WHERE business_id = ?",
            [$businessId]
        );
    }
}
