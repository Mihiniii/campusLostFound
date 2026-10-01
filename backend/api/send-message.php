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

/*
|--------------------------------------------------------------------------
| Reply message ID
|--------------------------------------------------------------------------
| Normal message = null
| Reply message = original message ID
|--------------------------------------------------------------------------
*/

$replyTo = $data["reply_to"] ?? null;


/*
|--------------------------------------------------------------------------
| Validate input
|--------------------------------------------------------------------------
*/

if (
    !$senderId ||
    !$receiverId ||
    !$itemId ||
    $message === ""
) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}


/*
|--------------------------------------------------------------------------
| Prevent sending message to yourself
|--------------------------------------------------------------------------
*/

if ((int)$senderId === (int)$receiverId) {
    echo json_encode([
        "success" => false,
        "message" => "You cannot send a message to yourself."
    ]);
    exit;
}


try {

    /*
    |--------------------------------------------------------------------------
    | Check item exists
    |--------------------------------------------------------------------------
    */

    $itemStmt = $pdo->prepare(
        "SELECT id
         FROM items
         WHERE id = :item_id"
    );

    $itemStmt->execute([
        ":item_id" => $itemId
    ]);

    $item = $itemStmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        echo json_encode([
            "success" => false,
            "message" => "Item not found."
        ]);
        exit;
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
        echo json_encode([
            "success" => false,
            "message" => "Receiver not found."
        ]);
        exit;
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
            echo json_encode([
                "success" => false,
                "message" => "Original message not found."
            ]);
            exit;
        }


        /*
        |--------------------------------------------------------------------------
        | Make sure reply belongs to same item
        |--------------------------------------------------------------------------
        */

        if ((int)$originalMessage["item_id"] !== (int)$itemId) {
            echo json_encode([
                "success" => false,
                "message" => "Invalid reply message."
            ]);
            exit;
        }


        /*
        |--------------------------------------------------------------------------
        | Make sure the users are part of the conversation
        |--------------------------------------------------------------------------
        */

        $validConversation =
            (
                (int)$originalMessage["sender_id"] === (int)$senderId &&
                (int)$originalMessage["receiver_id"] === (int)$receiverId
            )
            ||
            (
                (int)$originalMessage["sender_id"] === (int)$receiverId &&
                (int)$originalMessage["receiver_id"] === (int)$senderId
            );

        if (!$validConversation) {
            echo json_encode([
                "success" => false,
                "message" => "You cannot reply to this message."
            ]);
            exit;
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

    echo json_encode([
        "success" => true,
        "message" => "Message sent successfully!",
        "message_id" => $pdo->lastInsertId(),
        "reply_to" => $replyTo
    ]);


} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}