<?php
/**
 * Outbound Webhook Dispatcher
 */

declare(strict_types=1);

class WebhookService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Dispatch webhook event to all subscribed endpoints for this business
     */
    public function dispatch(int $businessId, string $event, array $payload): void {
        $webhooks = $this->db->fetchAll(
            "SELECT * FROM webhooks WHERE business_id = ? AND is_active = 1",
            [$businessId]
        );

        foreach ($webhooks as $wh) {
            $events = json_decode($wh['events_json'] ?? '[]', true) ?: [];
            if (in_array('*', $events, true) || in_array($event, $events, true)) {
                $this->sendWebhook($wh, $event, $payload);
            }
        }
    }

    private function sendWebhook(array $webhook, string $event, array $payload): void {
        $url = $webhook['target_url'];
        $secret = $webhook['secret_key'] ?? '';

        $body = json_encode([
            'event' => $event,
            'business_id' => $webhook['business_id'],
            'timestamp' => time(),
            'data' => $payload
        ]);

        $signature = hash_hmac('sha256', $body, $secret);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "X-BharatAI-Event: {$event}",
                "X-BharatAI-Signature: {$signature}",
                'User-Agent: BharatAI-Webhook-Dispatcher/1.0'
            ],
            CURLOPT_TIMEOUT => 10
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        $status = ($httpCode >= 200 && $httpCode < 300) ? 'delivered' : 'failed';

        $this->db->insert('webhook_logs', [
            'webhook_id' => $webhook['id'],
            'business_id' => $webhook['business_id'],
            'event_type' => $event,
            'payload_json' => $body,
            'response_code' => $httpCode ?: null,
            'response_body' => substr((string)$response, 0, 1000),
            'status' => $status,
            'error_message' => $error ?: null
        ]);
    }
}
