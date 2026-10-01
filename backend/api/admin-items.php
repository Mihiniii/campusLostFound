<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

require_admin($pdo);

try {

    // Every report, including returned ones
    $sql = "SELECT
                items.id,
                items.title,
                items.type,
                items.location,
                items.item_date,
                items.status,
                items.created_at,
                categories.name AS category,
                users.name AS reported_by,
                users.email AS reported_by_email
            FROM items
            LEFT JOIN categories
                ON items.category_id = categories.id
            LEFT JOIN users
                ON items.user_id = users.id
            ORDER BY items.id DESC";

    $stmt = $pdo->query($sql);

    json_response([
        "success" => true,
        "items" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (PDOException $e) {

    error_log("Admin items failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to load reports."
    ]);
}
