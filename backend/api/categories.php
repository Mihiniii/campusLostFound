<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

try {

    $stmt = $pdo->query(
        "SELECT id, name FROM categories ORDER BY id"
    );

    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "categories" => $categories
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Failed to load categories."
    ]);
}