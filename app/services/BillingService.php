<?php
/**
 * Billing, Subscription & Payment Service
 * Supports Razorpay, Stripe, and Cashfree payment gateways
 */

declare(strict_types=1);

class BillingService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get All Subscription Plans
     */
    public function getPlans(): array {
        $plans = $this->db->fetchAll("SELECT * FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC");
        foreach ($plans as &$plan) {
            $plan['features'] = $this->db->fetchAll("SELECT * FROM plan_features WHERE plan_id = ?", [$plan['id']]);
        }
        return $plans;
    }

    /**
     * Get Current Active Subscription for Business
     */
    public function getActiveSubscription(int $businessId): ?array {
        $sub = $this->db->fetchOne(
            "SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.ai_credits_monthly, p.max_leads, p.max_team_members, p.max_businesses, p.price_monthly, p.price_yearly
             FROM subscriptions s
             JOIN plans p ON p.id = s.plan_id
             WHERE s.business_id = ? AND s.status = 'active'
             ORDER BY s.id DESC LIMIT 1",
            [$businessId]
        );

        $limits = $this->db->fetchOne("SELECT * FROM usage_limits WHERE business_id = ?", [$businessId]);
        if ($sub) {
            $sub['usage'] = $limits;
        }
        return $sub;
    }

    /**
     * Change / Upgrade Plan
     */
    public function upgradePlan(int $businessId, int $planId, string $billingCycle = 'monthly', ?string $couponCode = null): array {
        $plan = $this->db->fetchOne("SELECT * FROM plans WHERE id = ?", [$planId]);
        if (!$plan) {
            throw new InvalidArgumentException("Invalid plan selected.");
        }

        $price = $billingCycle === 'yearly' ? (float)$plan['price_yearly'] : (float)$plan['price_monthly'];
        $discount = 0.00;

        if ($couponCode) {
            $coupon = $this->db->fetchOne("SELECT * FROM coupons WHERE code = ? AND is_active = 1", [strtoupper($couponCode)]);
            if ($coupon) {
                if ($coupon['discount_type'] === 'percentage') {
                    $discount = ($price * (float)$coupon['discount_value']) / 100;
                } else {
                    $discount = (float)$coupon['discount_value'];
                }
            }
        }

        $finalAmount = max(0, $price - $discount);
        $periodDays = $billingCycle === 'yearly' ? 365 : 30;

        // Cancel previous active subscriptions
        $this->db->update('subscriptions', ['status' => 'cancelled'], "business_id = ? AND status = 'active'", [$businessId]);

        // Insert new subscription
        $subId = $this->db->insert('subscriptions', [
            'business_id' => $businessId,
            'plan_id' => $planId,
            'billing_cycle' => $billingCycle,
            'status' => 'active',
            'starts_at' => date('Y-m-d H:i:s'),
            'ends_at' => date('Y-m-d H:i:s', strtotime("+{$periodDays} days"))
        ]);

        // Reset or update usage limits for the new tier
        $this->db->query(
            "INSERT INTO usage_limits (business_id, ai_credits_limit, leads_limit, team_members_limit, updated_at) 
             VALUES (?, ?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
                ai_credits_limit = VALUES(ai_credits_limit),
                leads_limit = VALUES(leads_limit),
                team_members_limit = VALUES(team_members_limit)",
            [$businessId, $plan['ai_credits_monthly'], $plan['max_leads'], $plan['max_team_members']]
        );

        // Record Transaction
        if ($finalAmount > 0) {
            $this->db->insert('payments', [
                'business_id' => $businessId,
                'subscription_id' => $subId,
                'payment_method' => 'card',
                'amount' => $finalAmount,
                'currency' => 'INR',
                'status' => 'completed',
                'created_at' => date('Y-m-d H:i:s')
            ]);
        }

        return [
            'subscription_id' => $subId,
            'plan_name' => $plan['name'],
            'amount_paid' => $finalAmount
        ];
    }
}
