<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once __DIR__ . "/../config/database.php";

try {

    $sql = "SELECT
            items.id,
            items.title,
            items.location,
            items.item_date,
            items.description,
            items.status,
            items.image_url,
            categories.name AS category
        FROM items
        LEFT JOIN categories
            ON items.category_id = categories.id
        WHERE items.type = 'lost'
        ORDER BY items.id DESC";

    $stmt = $pdo->query($sql);

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "items" => $items
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to load lost items."
    ]);
}