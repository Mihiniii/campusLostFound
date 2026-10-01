<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once __DIR__ . "/../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$userId = $data["user_id"] ?? null;
$title = trim($data["title"] ?? "");
$categoryId = $data["category_id"] ?? null;
$location = trim($data["location"] ?? "");

$latitude = $data["latitude"] ?? null;
$longitude = $data["longitude"] ?? null;

$itemDate = $data["item_date"] ?? "";
$description = trim($data["description"] ?? "");


/* Validate coordinates */

if (
    $latitude === null ||
    $longitude === null ||
    $latitude === "" ||
    $longitude === "" ||
    !is_numeric($latitude) ||
    !is_numeric($longitude)
) {
    echo json_encode([
        "success" => false,
        "message" => "Please select the item location on the map."
    ]);
    exit;
}

$latitude = (float) $latitude;
$longitude = (float) $longitude;


/* Validate coordinate range */

if (
    $latitude < -90 ||
    $latitude > 90 ||
    $longitude < -180 ||
    $longitude > 180
) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid map location."
    ]);
    exit;
}


/* Validate other fields */

if (
    !$userId ||
    !$categoryId ||
    $title === "" ||
    $location === "" ||
    $itemDate === "" ||
    $description === ""
) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}


try {

    $sql = "INSERT INTO items
            (
                user_id,
                category_id,
                title,
                type,
                location,
                latitude,
                longitude,
                item_date,
                description
            )
            VALUES
            (
                :user_id,
                :category_id,
                :title,
                'found',
                :location,
                :latitude,
                :longitude,
                :item_date,
                :description
            )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":user_id" => $userId,
        ":category_id" => $categoryId,
        ":title" => $title,
        ":location" => $location,
        ":latitude" => $latitude,
        ":longitude" => $longitude,
        ":item_date" => $itemDate,
        ":description" => $description
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Found item reported successfully!",
        "item_id" => $pdo->lastInsertId(),
        "latitude" => $latitude,
        "longitude" => $longitude
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}