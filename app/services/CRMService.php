<?php
/**
 * CRM Service - Leads & Customers Management
 */

declare(strict_types=1);

class CRMService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get Leads with Pagination, Filter and Search
     */
    public function getLeads(int $businessId, array $filters = [], int $page = 1, int $perPage = 20): array {
        $where = ["l.business_id = ?", "l.deleted_at IS NULL"];
        $params = [$businessId];

        if (!empty($filters['status_id'])) {
            $where[] = "l.status_id = ?";
            $params[] = (int)$filters['status_id'];
        }

        if (!empty($filters['source_id'])) {
            $where[] = "l.source_id = ?";
            $params[] = (int)$filters['source_id'];
        }

        if (!empty($filters['priority'])) {
            $where[] = "l.priority = ?";
            $params[] = $filters['priority'];
        }

        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $where[] = "(l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.company LIKE ? OR l.requirement LIKE ?)";
            $params = array_merge($params, [$search, $search, $search, $search, $search]);
        }

        $whereSql = implode(' AND ', $where);

        // Count total
        $countRow = $this->db->fetchOne("SELECT COUNT(*) as total FROM leads l WHERE {$whereSql}", $params);
        $total = (int)($countRow['total'] ?? 0);

        // Fetch page
        $offset = ($page - 1) * $perPage;
        $sql = "SELECT l.*, ls.name as status_name, ls.color_hex as status_color, 
                       src.name as source_name, u.full_name as assigned_user_name
                FROM leads l
                LEFT JOIN lead_statuses ls ON ls.id = l.status_id
                LEFT JOIN lead_sources src ON src.id = l.source_id
                LEFT JOIN users u ON u.id = l.assigned_user_id
                WHERE {$whereSql}
                ORDER BY l.created_at DESC
                LIMIT {$perPage} OFFSET {$offset}";

        $leads = $this->db->fetchAll($sql, $params);

        return [
            'leads' => $leads,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => max(1, (int)ceil($total / $perPage))
        ];
    }

    /**
     * Create Lead
     */
    public function createLead(int $businessId, array $data): int {
        $defaultStatus = $this->db->fetchOne("SELECT id FROM lead_statuses WHERE (business_id = ? OR business_id IS NULL) ORDER BY sort_order ASC LIMIT 1", [$businessId]);

        $leadId = $this->db->insert('leads', [
            'business_id' => $businessId,
            'assigned_user_id' => !empty($data['assigned_user_id']) ? (int)$data['assigned_user_id'] : currentUserId(),
            'source_id' => !empty($data['source_id']) ? (int)$data['source_id'] : 1,
            'status_id' => !empty($data['status_id']) ? (int)$data['status_id'] : ($defaultStatus['id'] ?? 1),
            'name' => trim($data['name'] ?? 'Unnamed Lead'),
            'email' => trim($data['email'] ?? ''),
            'phone' => trim($data['phone'] ?? ''),
            'company' => trim($data['company'] ?? ''),
            'title' => trim($data['title'] ?? ''),
            'location' => trim($data['location'] ?? ''),
            'requirement' => trim($data['requirement'] ?? ''),
            'estimated_value' => (float)($data['estimated_value'] ?? 0.00),
            'priority' => $data['priority'] ?? 'medium',
            'next_followup_date' => !empty($data['next_followup_date']) ? $data['next_followup_date'] : null
        ]);

        // Increment count in usage_limits
        $this->db->query("UPDATE usage_limits SET leads_count = leads_count + 1 WHERE business_id = ?", [$businessId]);

        // Record activity
        $this->db->insert('lead_activities', [
            'business_id' => $businessId,
            'lead_id' => $leadId,
            'user_id' => currentUserId(),
            'activity_type' => 'lead_created',
            'description' => "Lead created: " . ($data['name'] ?? 'Lead')
        ]);

        // Trigger Automation Rules
        $automation = new AutomationService();
        $automation->dispatch($businessId, 'lead.created', 'lead', $leadId, $data);

        // Dispatch Webhook
        $webhook = new WebhookService();
        $webhook->dispatch($businessId, 'lead.created', array_merge(['id' => $leadId], $data));

        return $leadId;
    }

    /**
     * Convert Lead to Customer
     */
    public function convertLeadToCustomer(int $businessId, int $leadId): int {
        $lead = $this->db->fetchOne("SELECT * FROM leads WHERE id = ? AND business_id = ?", [$leadId, $businessId]);
        if (!$lead) {
            throw new InvalidArgumentException("Lead not found.");
        }

        $customerId = $this->db->insert('customers', [
            'business_id' => $businessId,
            'converted_from_lead_id' => $leadId,
            'assigned_user_id' => $lead['assigned_user_id'],
            'name' => $lead['name'],
            'email' => $lead['email'],
            'phone' => $lead['phone'],
            'company' => $lead['company'],
            'city' => $lead['location'],
            'lifetime_value' => $lead['estimated_value'] ?? 0.00,
            'status' => 'active'
        ]);

        // Update lead status to Won
        $wonStatus = $this->db->fetchOne("SELECT id FROM lead_statuses WHERE is_won = 1 AND (business_id = ? OR business_id IS NULL) LIMIT 1", [$businessId]);
        if ($wonStatus) {
            $this->db->update('leads', ['status_id' => $wonStatus['id']], 'id = ?', [$leadId]);
        }

        // Record activity
        $this->db->insert('customer_activities', [
            'business_id' => $businessId,
            'customer_id' => $customerId,
            'user_id' => currentUserId(),
            'activity_type' => 'converted_from_lead',
            'description' => "Converted from CRM Lead #{$leadId}"
        ]);

        return $customerId;
    }

    /**
     * Get Real Dashboard Analytics Metrics
     */
    public function getDashboardMetrics(int $businessId): array {
        $totalLeads = (int)($this->db->fetchOne("SELECT COUNT(*) as c FROM leads WHERE business_id = ? AND deleted_at IS NULL", [$businessId])['c'] ?? 0);
        $newLeads = (int)($this->db->fetchOne("SELECT COUNT(*) as c FROM leads WHERE business_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND deleted_at IS NULL", [$businessId])['c'] ?? 0);
        $qualifiedLeads = (int)($this->db->fetchOne("SELECT COUNT(*) as c FROM leads WHERE business_id = ? AND (ai_score >= 70 OR status_id = 3) AND deleted_at IS NULL", [$businessId])['c'] ?? 0);
        $totalCustomers = (int)($this->db->fetchOne("SELECT COUNT(*) as c FROM customers WHERE business_id = ? AND deleted_at IS NULL", [$businessId])['c'] ?? 0);
        $aiUsageCount = (int)($this->db->fetchOne("SELECT COUNT(*) as c FROM ai_usage WHERE business_id = ?", [$businessId])['c'] ?? 0);
        $revenue = (float)($this->db->fetchOne("SELECT SUM(amount_paid) as rev FROM invoices WHERE business_id = ?", [$businessId])['rev'] ?? 0.00);
        $pendingTasks = (int)($this->db->fetchOne("SELECT COUNT(*) as c FROM tasks WHERE business_id = ? AND status != 'completed'", [$businessId])['c'] ?? 0);
        $dueFollowups = (int)($this->db->fetchOne("SELECT COUNT(*) as c FROM followups WHERE business_id = ? AND status = 'pending' AND scheduled_date <= CURRENT_DATE()", [$businessId])['c'] ?? 0);

        $conversionRate = $totalLeads > 0 ? round(($totalCustomers / $totalLeads) * 100, 1) : 0;

        // Recent Activity
        $recentLeads = $this->db->fetchAll(
            "SELECT l.id, l.name, l.company, l.estimated_value, l.ai_score, l.created_at, ls.name as status_name, ls.color_hex as status_color 
             FROM leads l 
             LEFT JOIN lead_statuses ls ON ls.id = l.status_id 
             WHERE l.business_id = ? AND l.deleted_at IS NULL 
             ORDER BY l.created_at DESC LIMIT 5",
            [$businessId]
        );

        // Sources distribution
        $leadSources = $this->db->fetchAll(
            "SELECT COALESCE(src.name, 'Direct / Other') as source, COUNT(*) as count 
             FROM leads l 
             LEFT JOIN lead_sources src ON src.id = l.source_id 
             WHERE l.business_id = ? AND l.deleted_at IS NULL 
             GROUP BY src.name",
            [$businessId]
        );

        return [
            'total_leads' => $totalLeads,
            'new_leads' => $newLeads,
            'qualified_leads' => $qualifiedLeads,
            'total_customers' => $totalCustomers,
            'conversion_rate' => $conversionRate,
            'ai_usage_count' => $aiUsageCount,
            'revenue' => $revenue,
            'pending_tasks' => $pendingTasks,
            'due_followups' => $dueFollowups,
            'recent_leads' => $recentLeads,
            'lead_sources' => $leadSources
        ];
    }
}
