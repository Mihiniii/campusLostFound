<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

$userId = require_login();

try {

    // A conversation = all messages between the logged-in user
    // and one other user about one item.
    // This returns the newest message of each conversation.
    $sql = "WITH mine AS (
                SELECT
                    messages.*,
                    CASE
                        WHEN messages.sender_id = :user_id
                        THEN messages.receiver_id
                        ELSE messages.sender_id
                    END AS other_id
                FROM messages
                WHERE messages.sender_id = :user_id
                   OR messages.receiver_id = :user_id
            )
            SELECT DISTINCT ON (mine.item_id, mine.other_id)
                mine.item_id,
                mine.other_id,
                mine.message AS last_message,
                mine.sender_id AS last_sender_id,
                mine.created_at AS last_at,
                users.name AS other_name,
                items.title AS item_title,
                items.type AS item_type,
                (
                    SELECT COUNT(*)
                    FROM messages AS unread
                    WHERE unread.item_id = mine.item_id
                      AND unread.sender_id = mine.other_id
                      AND unread.receiver_id = :user_id
                      AND unread.is_read = FALSE
                ) AS unread_count
            FROM mine
            LEFT JOIN users
                ON users.id = mine.other_id
            LEFT JOIN items
                ON items.id = mine.item_id
            ORDER BY
                mine.item_id,
                mine.other_id,
                mine.created_at DESC,
                mine.id DESC";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Newest conversation first
    usort(
        $conversations,
        fn($a, $b) => strcmp($b["last_at"], $a["last_at"])
    );

    foreach ($conversations as &$conversation) {
        $conversation["unread_count"] = (int) $conversation["unread_count"];
    }

    unset($conversation);

    json_response([
        "success" => true,
        "conversations" => $conversations
    ]);

} catch (PDOException $e) {

    error_log("Get conversations failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to load conversations."
    ]);
}
