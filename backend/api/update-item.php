<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/items.php";

require_method("POST");

$userId = require_login();

// Only the reporter or an admin can edit a report
$item = find_item_to_manage(
    $pdo,
    positive_int($_POST["item_id"] ?? null),
    $userId
);

$fields = read_item_fields($_POST);

// A new photo replaces the old one. Without a new photo the old one stays.
$newImageUrl = save_uploaded_image();

$imageUrl = $newImageUrl ?? $item["image_url"];

try {

    $sql = "UPDATE items
            SET category_id = :category_id,
                title = :title,
                location = :location,
                latitude = :latitude,
                longitude = :longitude,
                item_date = :item_date,
                description = :description,
                image_url = :image_url
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute($fields + [
        ":image_url" => $imageUrl,
        ":id" => $item["id"]
    ]);

    if ($newImageUrl !== null) {
        delete_uploaded_image($item["image_url"]);
    }

    json_response([
        "success" => true,
        "message" => "Report updated successfully!"
    ]);

} catch (PDOException $e) {

    error_log("Update item failed: " . $e->getMessage());

    delete_uploaded_image($newImageUrl);

    json_response([
        "success" => false,
        "message" => "Failed to update report. Please try again."
    ]);
}
