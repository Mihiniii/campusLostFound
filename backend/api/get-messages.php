<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

// A user can only read their own messages
$userId = require_login();

// One conversation: the messages with one other user about one item
$itemId = positive_int($_GET["item_id"] ?? null);
$otherId = positive_int($_GET["user_id"] ?? null);

if (!$itemId || !$otherId) {
    json_response([
        "success" => false,
        "message" => "Item and user are required."
    ]);
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

                reply_message.message AS replied_message,
                reply_sender.name AS replied_sender_name

            FROM messages

            LEFT JOIN users AS sender
                ON messages.sender_id = sender.id

            LEFT JOIN messages AS reply_message
                ON messages.reply_to = reply_message.id

            LEFT JOIN users AS reply_sender
                ON reply_message.sender_id = reply_sender.id

            WHERE messages.item_id = :item_id
              AND (
                    (messages.sender_id = :user_id AND messages.receiver_id = :other_id)
                 OR (messages.sender_id = :other_id AND messages.receiver_id = :user_id)
              )

            ORDER BY messages.created_at, messages.id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":item_id" => $itemId,
        ":user_id" => $userId,
        ":other_id" => $otherId
    ]);

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        "success" => true,
        "messages" => $messages
    ]);

} catch (PDOException $e) {

    error_log("Get messages failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to load messages."
    ]);
}
