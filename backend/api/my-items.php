<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

$userId = require_login();

try {

    // Reports made by the logged-in user
    $stmt = $pdo->prepare(
        "SELECT
            items.id,
            items.title,
            items.type,
            items.location,
            items.item_date,
            items.status,
            items.image_url,
            items.created_at,
            categories.name AS category
         FROM items
         LEFT JOIN categories
            ON items.category_id = categories.id
         WHERE items.user_id = :user_id
         ORDER BY items.id DESC"
    );

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Claims other people made on those reports
    $stmt = $pdo->prepare(
        "SELECT
            claims.id,
            claims.item_id,
            claims.user_id AS claimant_id,
            claims.message,
            claims.status,
            claims.created_at,
            users.name AS claimant_name
         FROM claims
         JOIN items
            ON claims.item_id = items.id
         LEFT JOIN users
            ON claims.user_id = users.id
         WHERE items.user_id = :user_id
         ORDER BY claims.id DESC"
    );

    $stmt->execute([
        ":user_id" => $userId
    ]);

    $claimsByItem = [];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $claim) {
        $claimsByItem[$claim["item_id"]][] = $claim;
    }

    foreach ($items as &$item) {
        $item["claims"] = $claimsByItem[$item["id"]] ?? [];
    }

    unset($item);

    // Claims the logged-in user made on other people's reports
    $stmt = $pdo->prepare(
        "SELECT
            claims.id,
            claims.item_id,
            claims.message,
            claims.status,
            claims.created_at,
            items.title AS item_title,
            items.type AS item_type
         FROM claims
         JOIN items
            ON claims.item_id = items.id
         WHERE claims.user_id = :user_id
         ORDER BY claims.id DESC"
    );

    $stmt->execute([
        ":user_id" => $userId
    ]);

    json_response([
        "success" => true,
        "items" => $items,
        "my_claims" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (PDOException $e) {

    error_log("My items failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to load your reports."
    ]);
}
