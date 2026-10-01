<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once __DIR__ . "/../config/database.php";

$id = $_GET["id"] ?? null;

if (!$id) {
    echo json_encode([
        "success" => false,
        "message" => "Item ID is required."
    ]);
    exit;
}

try {

    $sql = "SELECT
                items.id,
                items.title,
                items.type,
                items.location,
                items.latitude,
                items.longitude,
                items.item_date,
                items.description,
                items.status,
                items.image_url,
                categories.name AS category,
                users.id AS reported_by_id,
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
        echo json_encode([
            "success" => false,
            "message" => "Item not found."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "item" => $item
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to load item details."
    ]);
}