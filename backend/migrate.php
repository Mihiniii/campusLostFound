<?php

// Applies the SQL files in database/migrations to the database.
// Run from the project root:  php backend/migrate.php

if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit;
}

require_once __DIR__ . "/config/database.php";

$files = glob(__DIR__ . "/../database/migrations/*.sql");
sort($files);

foreach ($files as $file) {
    $pdo->exec(file_get_contents($file));

    echo "Applied " . basename($file) . "\n";
}

echo "Done.\n";
