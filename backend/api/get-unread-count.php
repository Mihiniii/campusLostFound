<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

$userId = require_login();

try {

    $sql = "SELECT COUNT(*) AS unread_count
            FROM messages
            WHERE receiver_id = :user_id
            AND is_read = FALSE";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $unreadCount = (int) $stmt->fetchColumn();

    // Claims on the user's reports that are waiting for an answer
    $sql = "SELECT COUNT(*)
            FROM claims
            JOIN items
                ON claims.item_id = items.id
            WHERE items.user_id = :user_id
            AND claims.status = 'pending'";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId
    ]);

    json_response([
        "success" => true,
        "unread_count" => $unreadCount,
        "pending_claims" => (int) $stmt->fetchColumn()
    ]);

} catch (PDOException $e) {

    error_log("Get unread count failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to get unread messages."
    ]);
}
