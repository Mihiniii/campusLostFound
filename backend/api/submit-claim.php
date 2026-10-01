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

$item_id = $data["item_id"] ?? null;
$user_id = $data["user_id"] ?? null;
$message = trim($data["message"] ?? "");

if (!$item_id || !$user_id || !$message) {
    echo json_encode([
        "success" => false,
        "message" => "Item, user and message are required."
    ]);
    exit;
}

try {

    // Check item exists
    $stmt = $pdo->prepare(
        "SELECT id FROM items WHERE id = :item_id"
    );

    $stmt->execute([
        ":item_id" => $item_id
    ]);

    if (!$stmt->fetch()) {
        echo json_encode([
            "success" => false,
            "message" => "Item not found."
        ]);
        exit;
    }

    // Insert claim
    $stmt = $pdo->prepare(
        "INSERT INTO claims (item_id, user_id, message)
         VALUES (:item_id, :user_id, :message)"
    );

    $stmt->execute([
        ":item_id" => $item_id,
        ":user_id" => $user_id,
        ":message" => $message
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Claim submitted successfully."
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to submit claim."
    ]);
}