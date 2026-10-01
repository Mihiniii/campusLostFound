<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

try {

    // Items that were already returned are not listed
    $sql = "SELECT
                items.id,
                items.title,
                items.location,
                items.latitude,
                items.longitude,
                items.item_date,
                items.description,
                items.status,
                items.image_url,
                items.created_at,
                categories.name AS category
            FROM items
            LEFT JOIN categories
                ON items.category_id = categories.id
            WHERE items.type = 'found'
              AND items.status = 'active'
            ORDER BY items.id DESC";

    $stmt = $pdo->query($sql);

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response([
        "success" => true,
        "items" => $items
    ]);

} catch (PDOException $e) {

    error_log("Found items failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to load found items."
    ]);
}
