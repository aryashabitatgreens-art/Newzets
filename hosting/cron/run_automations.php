<?php
/**
 * Cron Job: Run Pending Follow-ups & Automations
 *
 * cPanel Crontab command:
 * * /5 * * * php /home/username/public_html/cron/run_automations.php secret=YOUR_CRON_SECRET
 */

declare(strict_types=1);

require_once __DIR__ . '/../config.php';

// Security check for HTTP execution
if (php_sapi_name() !== 'cli') {
    $providedSecret = $_GET['secret'] ?? '';
    $cronSecret = env('CRON_SECRET_KEY', 'bharatai_cron_secret_772038102');
    if ($providedSecret !== $cronSecret) {
        http_response_code(403);
        die("Unauthorized Cron Access.");
    }
}

$db = Database::getInstance();
$startTime = microtime(true);
$processed = 0;

// 1. Process Due Follow-ups
$dueFollowups = $db->fetchAll(
    "SELECT f.*, l.name as lead_name, l.email as lead_email 
     FROM followups f
     JOIN leads l ON l.id = f.lead_id
     WHERE f.status = 'pending' AND f.scheduled_date <= NOW() 
     LIMIT 50"
);

foreach ($dueFollowups as $f) {
    // Notify or create task
    $db->update('followups', ['status' => 'completed'], 'id = ?', [$f['id']]);
    $processed++;
}

// 2. Log Cron Execution
$duration = microtime(true) - $startTime;
$db->insert('cron_logs', [
    'job_name' => 'run_automations',
    'status' => 'success',
    'output' => "Processed {$processed} follow-ups in " . round($duration, 3) . "s"
]);

echo "Cron run_automations completed. Processed: {$processed}\n";
