<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/items.php";

require_method("POST");

$userId = require_login();

$data = read_json();

// Only the reporter or an admin can delete a report
$item = find_item_to_manage(
    $pdo,
    positive_int($data["item_id"] ?? null),
    $userId
);

try {

    $pdo->beginTransaction();

    // Messages about the item are removed with it.
    // Claims are removed by the database (ON DELETE CASCADE).
    $stmt = $pdo->prepare(
        "DELETE FROM messages WHERE item_id = :id"
    );

    $stmt->execute([
        ":id" => $item["id"]
    ]);

    $stmt = $pdo->prepare(
        "DELETE FROM items WHERE id = :id"
    );

    $stmt->execute([
        ":id" => $item["id"]
    ]);

    $pdo->commit();

    delete_uploaded_image($item["image_url"]);

    json_response([
        "success" => true,
        "message" => "Report deleted."
    ]);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Delete item failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to delete report."
    ]);
}
