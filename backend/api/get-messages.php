<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

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

    $sql = "SELECT
                messages.id,
                messages.sender_id,
                messages.receiver_id,
                messages.item_id,
                messages.message,
                messages.reply_to,
                messages.is_read,
                messages.created_at,

                sender.name AS sender_name,
                receiver.name AS receiver_name,

                items.title AS item_title,

                reply_message.message AS replied_message,
                reply_sender.name AS replied_sender_name

            FROM messages

            LEFT JOIN users AS sender
                ON messages.sender_id = sender.id

            LEFT JOIN users AS receiver
                ON messages.receiver_id = receiver.id

            LEFT JOIN items
                ON messages.item_id = items.id

            LEFT JOIN messages AS reply_message
                ON messages.reply_to = reply_message.id

            LEFT JOIN users AS reply_sender
                ON reply_message.sender_id = reply_sender.id

            WHERE messages.sender_id = :user_id
               OR messages.receiver_id = :user_id

            ORDER BY messages.created_at DESC";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "messages" => $messages
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to load messages."
    ]);
}