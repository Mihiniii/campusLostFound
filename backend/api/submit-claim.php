<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("POST");

// The claim is always made by the logged-in user
$user_id = require_login();

$data = read_json();

$item_id = positive_int($data["item_id"] ?? null);
$message = trim((string) ($data["message"] ?? ""));

if (!$item_id || $message === "") {
    json_response([
        "success" => false,
        "message" => "Item and message are required."
    ]);
}

if (mb_strlen($message) > 2000) {
    json_response([
        "success" => false,
        "message" => "Message is too long."
    ]);
}

try {

    // Check item exists
    $stmt = $pdo->prepare(
        "SELECT id, user_id, status FROM items WHERE id = :item_id"
    );

    $stmt->execute([
        ":item_id" => $item_id
    ]);

    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        json_response([
            "success" => false,
            "message" => "Item not found."
        ]);
    }

    if ((int) $item["user_id"] === $user_id) {
        json_response([
            "success" => false,
            "message" => "You cannot claim your own report."
        ]);
    }

    if ($item["status"] !== "active") {
        json_response([
            "success" => false,
            "message" => "This item has already been returned."
        ]);
    }

    // One open claim per user for each item
    $stmt = $pdo->prepare(
        "SELECT id
         FROM claims
         WHERE item_id = :item_id
           AND user_id = :user_id
           AND status = 'pending'"
    );

    $stmt->execute([
        ":item_id" => $item_id,
        ":user_id" => $user_id
    ]);

    if ($stmt->fetch()) {
        json_response([
            "success" => false,
            "message" => "You already have a claim waiting for an answer on this item."
        ]);
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

    json_response([
        "success" => true,
        "message" => "Claim submitted successfully. The reporter will review it."
    ]);

} catch (PDOException $e) {

    error_log("Submit claim failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to submit claim."
    ]);
}
