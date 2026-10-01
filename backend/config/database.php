<?php

require_once __DIR__ . "/config.php";

$config = app_config();

try {
    $pdo = new PDO(
        "pgsql:host={$config['db_host']};port={$config['db_port']};dbname={$config['db_name']}",
        $config["db_user"],
        $config["db_password"]
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {

    // Keep the real error in the server log, not in the response
    error_log("Database connection failed: " . $e->getMessage());

    http_response_code(500);
    header("Content-Type: application/json");

    echo json_encode([
        "success" => false,
        "message" => "Server error. Please try again later."
    ]);
    exit;
}
