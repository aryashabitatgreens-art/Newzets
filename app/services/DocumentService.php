<?php
/**
 * Document, Proposal, Quotation & Invoice Management Service
 */

declare(strict_types=1);

class DocumentService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Create Quotation with calculated line items
     */
    public function createQuotation(int $businessId, array $data, array $items): int {
        $quoteNumber = 'QT-' . date('Y') . '-' . str_pad((string)rand(100, 9999), 4, '0', STR_PAD_LEFT);

        $subtotal = 0.00;
        foreach ($items as $item) {
            $qty = (float)($item['quantity'] ?? 1);
            $unitPrice = (float)($item['unit_price'] ?? 0);
            $subtotal += ($qty * $unitPrice);
        }

        $discount = (float)($data['discount_amount'] ?? 0);
        $taxRate = (float)($data['tax_rate'] ?? 18.0); // e.g. 18% GST in India
        $taxable = max(0, $subtotal - $discount);
        $taxAmount = ($taxable * $taxRate) / 100;
        $totalAmount = $taxable + $taxAmount;

        $quoteId = $this->db->insert('quotations', [
            'business_id' => $businessId,
            'customer_id' => !empty($data['customer_id']) ? (int)$data['customer_id'] : null,
            'lead_id' => !empty($data['lead_id']) ? (int)$data['lead_id'] : null,
            'quote_number' => $quoteNumber,
            'status' => 'draft',
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'valid_until' => !empty($data['valid_until']) ? $data['valid_until'] : date('Y-m-d', strtotime('+15 days')),
            'notes' => $data['notes'] ?? '',
            'terms' => $data['terms'] ?? 'Payment due within 15 days of acceptance. Taxes extra as applicable.'
        ]);

        foreach ($items as $item) {
            $qty = (float)($item['quantity'] ?? 1);
            $unitPrice = (float)($item['unit_price'] ?? 0);
            $itemTotal = $qty * $unitPrice;

            $this->db->insert('quotation_items', [
                'quotation_id' => $quoteId,
                'item_name' => $item['name'] ?? 'Item',
                'description' => $item['description'] ?? '',
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'total_price' => $itemTotal
            ]);
        }

        return $quoteId;
    }

    /**
     * Create Proposal
     */
    public function createProposal(int $businessId, array $data): int {
        $proposalId = $this->db->insert('proposals', [
            'business_id' => $businessId,
            'lead_id' => !empty($data['lead_id']) ? (int)$data['lead_id'] : null,
            'customer_id' => !empty($data['customer_id']) ? (int)$data['customer_id'] : null,
            'title' => $data['title'] ?? 'Business Proposal',
            'status' => 'draft',
            'introduction' => $data['introduction'] ?? '',
            'problem_statement' => $data['problem_statement'] ?? '',
            'solution' => $data['solution'] ?? '',
            'scope_of_work' => $data['scope_of_work'] ?? '',
            'deliverables' => $data['deliverables'] ?? '',
            'timeline' => $data['timeline'] ?? '',
            'pricing_table_json' => json_encode($data['pricing_items'] ?? []),
            'total_price' => (float)($data['total_price'] ?? 0.00),
            'terms_conditions' => $data['terms_conditions'] ?? 'Standard service terms apply.',
            'valid_until' => !empty($data['valid_until']) ? $data['valid_until'] : date('Y-m-d', strtotime('+30 days'))
        ]);

        return $proposalId;
    }
}
