<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

$id = positive_int($_GET["id"] ?? null);

if (!$id) {
    json_response([
        "success" => false,
        "message" => "Item ID is required."
    ]);
}

$userId = current_user_id();

try {

    $sql = "SELECT
                items.id,
                items.user_id,
                items.category_id,
                items.title,
                items.type,
                items.location,
                items.latitude,
                items.longitude,
                items.item_date,
                items.description,
                items.status,
                items.image_url,
                items.created_at,
                categories.name AS category,
                users.name AS reported_by
            FROM items
            LEFT JOIN categories
                ON items.category_id = categories.id
            LEFT JOIN users
                ON items.user_id = users.id
            WHERE items.id = :id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":id" => $id
    ]);

    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        json_response([
            "success" => false,
            "message" => "Item not found."
        ]);
    }

    $item["is_owner"] = $userId !== null && (int) $item["user_id"] === $userId;
    $item["my_claim_status"] = null;

    // The reporter's ID is never sent to the browser
    unset($item["user_id"]);

    if ($userId === null) {

        // Visitors do not see who reported the item
        $item["reported_by"] = null;

    } else {

        // The logged-in user's latest claim on this item
        $claimStmt = $pdo->prepare(
            "SELECT status
             FROM claims
             WHERE item_id = :item_id
               AND user_id = :user_id
             ORDER BY id DESC
             LIMIT 1"
        );

        $claimStmt->execute([
            ":item_id" => $id,
            ":user_id" => $userId
        ]);

        $item["my_claim_status"] = $claimStmt->fetchColumn() ?: null;
    }

    json_response([
        "success" => true,
        "item" => $item
    ]);

} catch (PDOException $e) {

    error_log("Item details failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to load item details."
    ]);
}
