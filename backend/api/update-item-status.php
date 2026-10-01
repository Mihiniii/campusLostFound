<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/items.php";

require_method("POST");

$userId = require_login();

$data = read_json();

// Only the reporter or an admin can change the status
$item = find_item_to_manage(
    $pdo,
    positive_int($data["item_id"] ?? null),
    $userId
);

$status = (string) ($data["status"] ?? "");

if (!in_array($status, ITEM_STATUSES, true)) {
    json_response([
        "success" => false,
        "message" => "Invalid status."
    ]);
}

try {

    $stmt = $pdo->prepare(
        "UPDATE items
         SET status = :status
         WHERE id = :id"
    );

    $stmt->execute([
        ":status" => $status,
        ":id" => $item["id"]
    ]);

    json_response([
        "success" => true,
        "message" => $status === "returned"
            ? "Item marked as returned."
            : "Item is active again."
    ]);

} catch (PDOException $e) {

    error_log("Update item status failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to update status."
    ]);
}
