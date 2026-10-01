<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("POST");

// A user can only mark their own messages as read
$userId = require_login();

$data = read_json();

// Only the opened conversation is marked as read
$itemId = positive_int($data["item_id"] ?? null);
$otherId = positive_int($data["user_id"] ?? null);

if (!$itemId || !$otherId) {
    json_response([
        "success" => false,
        "message" => "Item and user are required."
    ]);
}

try {

    $sql = "UPDATE messages
            SET is_read = TRUE
            WHERE receiver_id = :user_id
            AND sender_id = :other_id
            AND item_id = :item_id
            AND is_read = FALSE";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId,
        ":other_id" => $otherId,
        ":item_id" => $itemId
    ]);

    json_response([
        "success" => true,
        "message" => "Messages marked as read."
    ]);

} catch (PDOException $e) {

    error_log("Mark messages read failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to mark messages as read."
    ]);
}
