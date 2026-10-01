<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once __DIR__ . "/../config/database.php";

$userId = $_POST["user_id"] ?? null;
$title = trim($_POST["title"] ?? "");
$categoryId = $_POST["category_id"] ?? null;
$location = trim($_POST["location"] ?? "");

$latitude = $_POST["latitude"] ?? null;
$longitude = $_POST["longitude"] ?? null;

$itemDate = $_POST["item_date"] ?? "";
$description = trim($_POST["description"] ?? "");

// Validate coordinates
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

$imageUrl = null;


// Image upload
if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {

    $uploadDir = __DIR__ . "/../uploads/";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    $fileType = mime_content_type(
        $_FILES["image"]["tmp_name"]
    );

    if (!in_array($fileType, $allowedTypes)) {

        echo json_encode([
            "success" => false,
            "message" => "Only image files are allowed."
        ]);

        exit;
    }


    // Maximum 5MB
    if ($_FILES["image"]["size"] > 5 * 1024 * 1024) {

        echo json_encode([
            "success" => false,
            "message" => "Image must be less than 5MB."
        ]);

        exit;
    }


    $extension = pathinfo(
        $_FILES["image"]["name"],
        PATHINFO_EXTENSION
    );

    $fileName = uniqid("item_", true) .
        "." .
        strtolower($extension);

    $filePath = $uploadDir . $fileName;


    if (!move_uploaded_file(
        $_FILES["image"]["tmp_name"],
        $filePath
    )) {

        echo json_encode([
            "success" => false,
            "message" => "Failed to upload image."
        ]);

        exit;
    }


    $imageUrl = "uploads/" . $fileName;
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
                description,
                image_url
            )
            VALUES
            (
                :user_id,
                :category_id,
                :title,
                'lost',
                :location,
                :latitude,
                :longitude,
                :item_date,
                :description,
                :image_url
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
        ":description" => $description,
        ":image_url" => $imageUrl
    ]);


    echo json_encode([
        "success" => true,
        "message" => "Lost item reported successfully!",
        "item_id" => $pdo->lastInsertId(),
        "image_url" => $imageUrl,
        "latitude" => $latitude,
        "longitude" => $longitude
    ]);


} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}