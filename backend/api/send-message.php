<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("POST");

// The sender is always the logged-in user
$senderId = require_login();

$data = read_json();

// Without a receiver the message goes to the person who reported the item
$receiverId = positive_int($data["receiver_id"] ?? null);
$itemId = positive_int($data["item_id"] ?? null);
$message = trim((string) ($data["message"] ?? ""));

/*
|--------------------------------------------------------------------------
| Reply message ID
|--------------------------------------------------------------------------
| Normal message = null
| Reply message = original message ID
|--------------------------------------------------------------------------
*/

$replyTo = $data["reply_to"] ?? null;

if ($replyTo !== null) {
    $replyTo = positive_int($replyTo);

    if ($replyTo === null) {
        json_response([
            "success" => false,
            "message" => "Invalid reply message."
        ]);
    }
}


/*
|--------------------------------------------------------------------------
| Validate input
|--------------------------------------------------------------------------
*/

if (
    !$itemId ||
    $message === ""
) {
    json_response([
        "success" => false,
        "message" => "All fields are required."
    ]);
}

if (mb_strlen($message) > 2000) {
    json_response([
        "success" => false,
        "message" => "Message is too long."
    ]);
}


try {

    /*
    |--------------------------------------------------------------------------
    | Check item exists
    |--------------------------------------------------------------------------
    */

    $itemStmt = $pdo->prepare(
        "SELECT id, user_id
         FROM items
         WHERE id = :item_id"
    );

    $itemStmt->execute([
        ":item_id" => $itemId
    ]);

    $item = $itemStmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        json_response([
            "success" => false,
            "message" => "Item not found."
        ]);
    }

    $ownerId = (int) $item["user_id"];

    if (!$receiverId) {
        $receiverId = $ownerId;
    }


    /*
    |--------------------------------------------------------------------------
    | Prevent sending message to yourself
    |--------------------------------------------------------------------------
    */

    if ($senderId === $receiverId) {
        json_response([
            "success" => false,
            "message" => "You cannot send a message to yourself."
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Check receiver exists
    |--------------------------------------------------------------------------
    */

    $userStmt = $pdo->prepare(
        "SELECT id
         FROM users
         WHERE id = :receiver_id"
    );

    $userStmt->execute([
        ":receiver_id" => $receiverId
    ]);

    $receiver = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$receiver) {
        json_response([
            "success" => false,
            "message" => "Receiver not found."
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Check the sender is allowed to message this receiver
    |--------------------------------------------------------------------------
    | Allowed when:
    |  - the receiver reported the item, or
    |  - the receiver has already messaged the sender about this item, or
    |  - the sender reported the item and the receiver made a claim on it.
    |--------------------------------------------------------------------------
    */

    if ($ownerId !== $receiverId) {

        $contactStmt = $pdo->prepare(
            "SELECT id
             FROM messages
             WHERE item_id = :item_id
               AND sender_id = :receiver_id
               AND receiver_id = :sender_id
             LIMIT 1"
        );

        $contactStmt->execute([
            ":item_id" => $itemId,
            ":receiver_id" => $receiverId,
            ":sender_id" => $senderId
        ]);

        $allowed = (bool) $contactStmt->fetch();

        if (!$allowed && $ownerId === $senderId) {

            $claimStmt = $pdo->prepare(
                "SELECT id
                 FROM claims
                 WHERE item_id = :item_id
                   AND user_id = :receiver_id
                 LIMIT 1"
            );

            $claimStmt->execute([
                ":item_id" => $itemId,
                ":receiver_id" => $receiverId
            ]);

            $allowed = (bool) $claimStmt->fetch();
        }

        if (!$allowed) {
            json_response([
                "success" => false,
                "message" => "You cannot message this user about this item."
            ], 403);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Check reply message
    |--------------------------------------------------------------------------
    */

    if ($replyTo !== null) {

        $replyStmt = $pdo->prepare(
            "SELECT
                id,
                sender_id,
                receiver_id,
                item_id
             FROM messages
             WHERE id = :reply_to"
        );

        $replyStmt->execute([
            ":reply_to" => $replyTo
        ]);

        $originalMessage = $replyStmt->fetch(PDO::FETCH_ASSOC);

        if (!$originalMessage) {
            json_response([
                "success" => false,
                "message" => "Original message not found."
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Make sure reply belongs to same item
        |--------------------------------------------------------------------------
        */

        if ((int)$originalMessage["item_id"] !== $itemId) {
            json_response([
                "success" => false,
                "message" => "Invalid reply message."
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Make sure the users are part of the conversation
        |--------------------------------------------------------------------------
        */

        $validConversation =
            (
                (int)$originalMessage["sender_id"] === $senderId &&
                (int)$originalMessage["receiver_id"] === $receiverId
            )
            ||
            (
                (int)$originalMessage["sender_id"] === $receiverId &&
                (int)$originalMessage["receiver_id"] === $senderId
            );

        if (!$validConversation) {
            json_response([
                "success" => false,
                "message" => "You cannot reply to this message."
            ], 403);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Insert message
    |--------------------------------------------------------------------------
    */

    $sql = "INSERT INTO messages
            (
                sender_id,
                receiver_id,
                item_id,
                message,
                reply_to
            )
            VALUES
            (
                :sender_id,
                :receiver_id,
                :item_id,
                :message,
                :reply_to
            )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":sender_id" => $senderId,
        ":receiver_id" => $receiverId,
        ":item_id" => $itemId,
        ":message" => $message,
        ":reply_to" => $replyTo
    ]);


    /*
    |--------------------------------------------------------------------------
    | Success response
    |--------------------------------------------------------------------------
    */

    json_response([
        "success" => true,
        "message" => "Message sent successfully!",
        "message_id" => $pdo->lastInsertId(),
        "reply_to" => $replyTo
    ]);


} catch (PDOException $e) {

    error_log("Send message failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to send message. Please try again."
    ]);
}
