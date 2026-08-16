<?php
/**
 * BharatAI Database Manager (PDO)
 * Supports MySQL 8+ in Production / SQLite in Development
 */

declare(strict_types=1);

class Database {
    private static ?Database $instance = null;
    private PDO $pdo;

    private function __construct() {
        $driver = env('DB_CONNECTION', 'sqlite');

        if ($driver === 'mysql' && env('DB_HOST') && env('DB_NAME')) {
            $host = env('DB_HOST', '127.0.0.1');
            $port = env('DB_PORT', 3306);
            $dbName = env('DB_NAME', 'bharatai_db');
            $user = env('DB_USER', 'root');
            $pass = env('DB_PASSWORD', '');
            $charset = 'utf8mb4';

            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                $this->pdo = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // If MySQL connection fails, fall back to SQLite if in dev
                if (APP_DEBUG) {
                    $this->initSqlite();
                } else {
                    throw new RuntimeException("Database Connection Error: " . $e->getMessage());
                }
            }
        } else {
            $this->initSqlite();
        }
    }

    private function initSqlite(): void {
        $sqlitePath = STORAGE_PATH . '/database.sqlite';
        $needsInit = !file_exists($sqlitePath) || filesize($sqlitePath) === 0;

        if (!is_dir(STORAGE_PATH)) {
            mkdir(STORAGE_PATH, 0775, true);
        }

        $dsn = "sqlite:" . $sqlitePath;
        $this->pdo = new PDO($dsn, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        $this->pdo->exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");

        if ($needsInit) {
            $this->migrateSqliteSchema();
        }
    }

    /**
     * Translates and executes schema on SQLite if running in zero-config dev mode
     */
    private function migrateSqliteSchema(): void {
        $schemaPath = BHARAT_ROOT . '/database/schema.sql';
        $seedPath = BHARAT_ROOT . '/database/seed_demo.sql';

        if (file_exists($schemaPath)) {
            $sql = file_get_contents($schemaPath);
            // Adapt MySQL specific syntax for SQLite
            $sql = preg_replace('/ENGINE=InnoDB.*?COLLATE=utf8mb4_unicode_ci/i', '', $sql);
            $sql = preg_replace('/INT UNSIGNED AUTO_INCREMENT PRIMARY KEY/i', 'INTEGER PRIMARY KEY AUTOINCREMENT', $sql);
            $sql = preg_replace('/INT UNSIGNED/i', 'INTEGER', $sql);
            $sql = preg_replace('/BIGINT UNSIGNED/i', 'INTEGER', $sql);
            $sql = preg_replace('/TINYINT\(1\)/i', 'INTEGER', $sql);
            $sql = preg_replace('/TINYINT UNSIGNED/i', 'INTEGER', $sql);
            $sql = preg_replace('/TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/i', 'TIMESTAMP', $sql);
            $sql = preg_replace('/ON UPDATE CURRENT_TIMESTAMP/i', '', $sql);
            $sql = preg_replace('/JSON NULL/i', 'TEXT NULL', $sql);
            $sql = preg_replace('/LONGTEXT/i', 'TEXT', $sql);
            $sql = preg_replace('/ENUM\([^)]+\)/i', 'VARCHAR(50)', $sql);
            $sql = preg_replace('/FULLTEXT KEY.*?,/i', '', $sql);
            $sql = preg_replace('/KEY `idx_[^`]+` \([^)]+\)/i', '', $sql);
            $sql = preg_replace('/,\s*\)/m', "\n)", $sql);
            $sql = preg_replace('/SET FOREIGN_KEY_CHECKS.*?;/i', '', $sql);
            $sql = preg_replace('/SET SQL_MODE.*?;/i', '', $sql);
            $sql = preg_replace('/SET time_zone.*?;/i', '', $sql);

            $statements = array_filter(array_map('trim', explode(';', $sql)));
            foreach ($statements as $stmt) {
                if (!empty($stmt)) {
                    try {
                        $this->pdo->exec($stmt);
                    } catch (\Throwable $e) {
                        // Ignore individual SQLite translation nuances
                    }
                }
            }
        }

        if (file_exists($seedPath)) {
            $seedSql = file_get_contents($seedPath);
            $seedSql = preg_replace('/ON DUPLICATE KEY UPDATE.*?;/i', ';', $seedSql);
            $seedStatements = array_filter(array_map('trim', explode(';', $seedSql)));
            foreach ($seedStatements as $stmt) {
                if (!empty($stmt)) {
                    try {
                        $this->pdo->exec($stmt);
                    } catch (\Throwable $e) {
                        // ignore seed duplicates
                    }
                }
            }
        }
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getPdo(): PDO {
        return $this->pdo;
    }

    public function query(string $sql, array $params = []): PDOStatement {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetchOne(string $sql, array $params = []): ?array {
        $stmt = $this->query($sql, $params);
        $result = $stmt->fetch();
        return $result === false ? null : $result;
    }

    public function fetchAll(string $sql, array $params = []): array {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function insert(string $table, array $data): int {
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($columns), '?');
        $sql = "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
        $this->query($sql, array_values($data));
        return (int)$this->pdo->lastInsertId();
    }

    public function update(string $table, array $data, string $whereClause, array $whereParams = []): int {
        $setClauses = [];
        $values = [];
        foreach ($data as $column => $value) {
            $setClauses[] = "`{$column}` = ?";
            $values[] = $value;
        }
        $sql = "UPDATE `{$table}` SET " . implode(', ', $setClauses) . " WHERE {$whereClause}";
        $stmt = $this->query($sql, array_merge($values, $whereParams));
        return $stmt->rowCount();
    }

    public function delete(string $table, string $whereClause, array $whereParams = []): int {
        $sql = "DELETE FROM `{$table}` WHERE {$whereClause}";
        $stmt = $this->query($sql, $whereParams);
        return $stmt->rowCount();
    }

    public function lastInsertId(): int {
        return (int)$this->pdo->lastInsertId();
    }

    public function beginTransaction(): bool {
        return $this->pdo->beginTransaction();
    }

    public function commit(): bool {
        return $this->pdo->commit();
    }

    public function rollBack(): bool {
        return $this->pdo->rollBack();
    }
}
