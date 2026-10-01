<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");

require_once __DIR__ . "/../config/database.php";

$userId = $_GET["user_id"] ?? null;

if (!$userId) {
    echo json_encode([
        "success" => false,
        "message" => "User ID is required."
    ]);
    exit;
}

try {

    $sql = "SELECT COUNT(*) AS unread_count
            FROM messages
            WHERE receiver_id = :user_id
            AND is_read = FALSE";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "unread_count" => (int)$result["unread_count"]
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to get unread messages."
    ]);
}