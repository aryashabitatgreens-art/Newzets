<?php
/**
 * SMTP Mail Dispatcher & Template Engine
 */

declare(strict_types=1);

class MailService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Send email using configured SMTP or PHP mailer
     */
    public function send(string $to, string $subject, string $bodyHtml, ?int $businessId = null, string $templateSlug = ''): bool {
        $businessId = $businessId ?? currentBusinessId();
        $fromEmail = env('MAIL_FROM_ADDRESS', 'noreply@bharatai.com');
        $fromName = env('MAIL_FROM_NAME', 'BharatAI Business OS');

        // Check if business has custom SMTP configured
        if ($businessId) {
            $smtp = $this->db->fetchOne("SELECT * FROM business_settings WHERE business_id = ?", [$businessId]);
            if (!empty($smtp['smtp_host']) && !empty($smtp['smtp_username'])) {
                $fromEmail = $smtp['smtp_from_email'] ?? $fromEmail;
                $fromName = $smtp['smtp_from_name'] ?? $fromName;
            }
        }

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            "From: {$fromName} <{$fromEmail}>",
            "Reply-To: {$fromEmail}",
            'X-Mailer: BharatAI-Business-OS/1.0'
        ];

        $status = 'sent';
        $errorMessage = null;

        try {
            // Native PHP mail delivery
            $success = @mail($to, $subject, $bodyHtml, implode("\r\n", $headers));
            if (!$success && APP_ENV === 'production') {
                $status = 'failed';
                $errorMessage = "Mail transfer agent could not deliver message.";
            }
        } catch (\Throwable $e) {
            $status = 'failed';
            $errorMessage = $e->getMessage();
        }

        // Log in email_logs
        $this->db->insert('email_logs', [
            'business_id' => $businessId,
            'recipient_email' => $to,
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'template_slug' => $templateSlug,
            'status' => $status,
            'error_message' => $errorMessage
        ]);

        return $status === 'sent';
    }

    /**
     * Send Templated Email with Variable Replacements
     */
    public function sendTemplate(string $to, string $templateSlug, array $variables, ?int $businessId = null): bool {
        $template = $this->db->fetchOne(
            "SELECT * FROM email_templates WHERE slug = ? AND (business_id = ? OR business_id IS NULL) ORDER BY business_id DESC LIMIT 1",
            [$templateSlug, $businessId]
        );

        if (!$template) {
            // Default built-in template
            $subject = "Update from BharatAI";
            $body = "<p>Hello {{name}},</p><p>You have a new update regarding your account.</p>";
        } else {
            $subject = $template['subject'];
            $body = $template['body_html'];
        }

        // Replace placeholders {{variable}}
        foreach ($variables as $key => $val) {
            $subject = str_replace("{{" . $key . "}}", (string)$val, $subject);
            $body = str_replace("{{" . $key . "}}", (string)$val, $body);
        }

        // Wrap in clean responsive email layout
        $fullHtml = $this->wrapLayout($subject, $body);
        return $this->send($to, $subject, $fullHtml, $businessId, $templateSlug);
    }

    private function wrapLayout(string $title, string $content): string {
        return '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>' . htmlspecialchars($title) . '</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: #0f172a; padding: 24px 32px; color: #ffffff;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">BharatAI Business OS</h2>
    </div>
    <div style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.6;">
      ' . $content . '
    </div>
    <div style="background: #f1f5f9; padding: 16px 32px; font-size: 12px; color: #64748b; text-align: center;">
      &copy; ' . date('Y') . ' BharatAI Business OS. All rights reserved.
    </div>
  </div>
</body>
</html>';
    }
}
