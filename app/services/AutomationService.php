<?php
/**
 * Workflow Automation Service & Cron Rule Engine
 */

declare(strict_types=1);

class AutomationService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Dispatch an event through active business automation rules
     */
    public function dispatch(int $businessId, string $triggerEvent, string $entityType, int $entityId, array $payload = []): void {
        $rules = $this->db->fetchAll(
            "SELECT * FROM automation_rules WHERE business_id = ? AND trigger_event = ? AND is_active = 1",
            [$businessId, $triggerEvent]
        );

        foreach ($rules as $rule) {
            $this->executeRule($rule, $entityType, $entityId, $payload);
        }
    }

    /**
     * Execute a specific automation action
     */
    public function executeRule(array $rule, string $entityType, int $entityId, array $payload): void {
        $actionType = $rule['action_type'];
        $actionConfig = json_decode($rule['action_config_json'] ?? '{}', true) ?: [];
        $businessId = (int)$rule['business_id'];
        $status = 'success';
        $errorMessage = null;

        try {
            switch ($actionType) {
                case 'send_email':
                    $mailer = new MailService();
                    $to = $payload['email'] ?? $actionConfig['recipient_email'] ?? '';
                    if ($to) {
                        $templateSlug = $actionConfig['template_slug'] ?? 'lead_welcome';
                        $mailer->sendTemplate($to, $templateSlug, $payload, $businessId);
                    }
                    break;

                case 'create_task':
                    $this->db->insert('tasks', [
                        'business_id' => $businessId,
                        'assigned_user_id' => currentUserId() ?? 1,
                        'lead_id' => $entityType === 'lead' ? $entityId : null,
                        'title' => $actionConfig['task_title'] ?? "Follow up with {$payload['name']}",
                        'description' => "Automated task triggered by event {$rule['trigger_event']}",
                        'priority' => 'high',
                        'due_date' => date('Y-m-d H:i:s', strtotime('+1 day')),
                        'status' => 'pending'
                    ]);
                    break;

                case 'ai_qualify':
                    if ($entityType === 'lead') {
                        $ai = new AIService();
                        $qualification = $ai->qualifyLead($payload);
                        if ($qualification['success'] && !empty($qualification['data'])) {
                            $data = $qualification['data'];
                            $this->db->update('leads', [
                                'ai_score' => (int)($data['score'] ?? 75),
                                'ai_summary' => $data['summary'] ?? '',
                                'ai_intent' => $data['intent'] ?? '',
                                'ai_buying_probability' => $data['buying_probability'] ?? ''
                            ], 'id = ?', [$entityId]);
                        }
                    }
                    break;
            }
        } catch (\Throwable $e) {
            $status = 'failed';
            $errorMessage = $e->getMessage();
        }

        // Log automation run
        $this->db->insert('automation_runs', [
            'business_id' => $businessId,
            'rule_id' => $rule['id'],
            'trigger_event' => $rule['trigger_event'],
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'status' => $status,
            'error_message' => $errorMessage
        ]);
    }
}
