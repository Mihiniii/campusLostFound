<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once __DIR__ . "/../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$senderId = $data["sender_id"] ?? null;
$receiverId = $data["receiver_id"] ?? null;
$itemId = $data["item_id"] ?? null;
$message = trim($data["message"] ?? "");

if (!$senderId || !$receiverId || !$itemId || $message === "") {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}

if ((int)$senderId === (int)$receiverId) {
    echo json_encode([
        "success" => false,
        "message" => "You cannot reply to yourself."
    ]);
    exit;
}

try {

    $sql = "INSERT INTO messages
            (
                sender_id,
                receiver_id,
                item_id,
                message,
                is_read
            )
            VALUES
            (
                :sender_id,
                :receiver_id,
                :item_id,
                :message,
                FALSE
            )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":sender_id" => $senderId,
        ":receiver_id" => $receiverId,
        ":item_id" => $itemId,
        ":message" => $message
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Reply sent successfully!"
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}