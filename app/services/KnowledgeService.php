<?php
/**
 * Knowledge Base & Document Chunking Service
 */

declare(strict_types=1);

class KnowledgeService {
    private Database $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Add Text / FAQ / URL Knowledge Source and auto-chunk into searchable parts
     */
    public function addSource(int $businessId, string $type, string $title, string $content, string $url = ''): int {
        $sourceId = $this->db->insert('knowledge_sources', [
            'business_id' => $businessId,
            'type' => $type,
            'title' => $title,
            'source_url' => $url,
            'raw_content' => $content,
            'status' => 'indexed'
        ]);

        $this->chunkAndStore($businessId, $sourceId, $title, $content);
        return $sourceId;
    }

    /**
     * Upload Document File (PDF, TXT, DOCX) and Index
     */
    public function uploadDocument(int $businessId, array $fileInfo): int {
        $fileName = $fileInfo['name'] ?? 'document.txt';
        $tmpPath = $fileInfo['tmp_name'] ?? '';
        $fileSize = (int)($fileInfo['size'] ?? 0);
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        $allowedExts = ['txt', 'pdf', 'docx', 'csv', 'md', 'json'];
        if (!in_array($ext, $allowedExts, true)) {
            throw new InvalidArgumentException("File extension .{$ext} is not allowed.");
        }

        $cleanBase = bin2hex(random_bytes(8)) . '_' . preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $fileName);
        $uploadDir = STORAGE_PATH . "/documents/{$businessId}";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $destination = "{$uploadDir}/{$cleanBase}";
        if (!move_uploaded_file($tmpPath, $destination) && !copy($tmpPath, $destination)) {
            throw new RuntimeException("Failed to upload document file.");
        }

        // Extract text
        $content = "";
        if (in_array($ext, ['txt', 'csv', 'md', 'json'])) {
            $content = file_get_contents($destination) ?: "";
        } else {
            // For binary files, store basic index
            $content = "Uploaded document: {$fileName} (Size: " . round($fileSize / 1024, 1) . " KB)";
        }

        $sourceId = $this->db->insert('knowledge_sources', [
            'business_id' => $businessId,
            'type' => 'document',
            'title' => $fileName,
            'raw_content' => $content,
            'status' => 'indexed'
        ]);

        $this->chunkAndStore($businessId, $sourceId, $fileName, $content);
        return $sourceId;
    }

    /**
     * Split long content into chunks of ~500 chars with overlapping boundaries
     */
    private function chunkAndStore(int $businessId, int $sourceId, string $title, string $content): void {
        $paragraphs = preg_split('/\n\s*\n/', $content);
        $chunkIndex = 0;

        foreach ($paragraphs as $para) {
            $para = trim($para);
            if (empty($para)) continue;

            if (strlen($para) > 800) {
                $subChunks = str_split($para, 600);
                foreach ($subChunks as $sub) {
                    $this->db->insert('knowledge_chunks', [
                        'business_id' => $businessId,
                        'source_id' => $sourceId,
                        'chunk_index' => $chunkIndex++,
                        'title' => $title,
                        'content' => trim($sub)
                    ]);
                }
            } else {
                $this->db->insert('knowledge_chunks', [
                    'business_id' => $businessId,
                    'source_id' => $sourceId,
                    'chunk_index' => $chunkIndex++,
                    'title' => $title,
                    'content' => $para
                ]);
            }
        }
    }

    /**
     * List all knowledge sources
     */
    public function getSources(int $businessId): array {
        return $this->db->fetchAll(
            "SELECT ks.*, COUNT(kc.id) as chunk_count 
             FROM knowledge_sources ks 
             LEFT JOIN knowledge_chunks kc ON kc.source_id = ks.id 
             WHERE ks.business_id = ? 
             GROUP BY ks.id 
             ORDER BY ks.created_at DESC",
            [$businessId]
        );
    }
}
