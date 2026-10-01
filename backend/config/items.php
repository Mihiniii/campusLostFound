<?php

// Helpers shared by the endpoints that create, change or delete items.

const ITEM_STATUSES = ["active", "returned"];


// Reads and checks the item fields of a report form.
// Stops with an error message if something is wrong.
function read_item_fields(array $input): array
{
    $title = trim((string) ($input["title"] ?? ""));
    $categoryId = positive_int($input["category_id"] ?? null);
    $location = trim((string) ($input["location"] ?? ""));

    $latitude = $input["latitude"] ?? null;
    $longitude = $input["longitude"] ?? null;

    $itemDate = (string) ($input["item_date"] ?? "");
    $description = trim((string) ($input["description"] ?? ""));

    // Validate coordinates
    if (
        $latitude === null ||
        $longitude === null ||
        $latitude === "" ||
        $longitude === "" ||
        !is_numeric($latitude) ||
        !is_numeric($longitude)
    ) {
        json_response([
            "success" => false,
            "message" => "Please select the item location on the map."
        ]);
    }

    $latitude = (float) $latitude;
    $longitude = (float) $longitude;

    if (
        $latitude < -90 ||
        $latitude > 90 ||
        $longitude < -180 ||
        $longitude > 180
    ) {
        json_response([
            "success" => false,
            "message" => "Invalid map location."
        ]);
    }

    if (
        !$categoryId ||
        $title === "" ||
        $location === "" ||
        $itemDate === "" ||
        $description === ""
    ) {
        json_response([
            "success" => false,
            "message" => "All fields are required."
        ]);
    }

    if (!valid_date($itemDate)) {
        json_response([
            "success" => false,
            "message" => "Invalid date."
        ]);
    }

    if (
        mb_strlen($title) > 150 ||
        mb_strlen($location) > 150 ||
        mb_strlen($description) > 2000
    ) {
        json_response([
            "success" => false,
            "message" => "Title, location or description is too long."
        ]);
    }

    return [
        ":category_id" => $categoryId,
        ":title" => $title,
        ":location" => $location,
        ":latitude" => $latitude,
        ":longitude" => $longitude,
        ":item_date" => $itemDate,
        ":description" => $description
    ];
}


// Saves the uploaded photo and returns its path ("uploads/..."),
// or null when no photo was sent
function save_uploaded_image(string $field = "image"): ?string
{
    if (
        !isset($_FILES[$field]) ||
        $_FILES[$field]["error"] === UPLOAD_ERR_NO_FILE
    ) {
        return null;
    }

    if ($_FILES[$field]["error"] !== UPLOAD_ERR_OK) {
        json_response([
            "success" => false,
            "message" => "Failed to upload image."
        ]);
    }

    $uploadDir = __DIR__ . "/../uploads/";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // The file extension comes from the real file type,
    // never from the file name the user sent
    $allowedTypes = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp",
        "image/gif" => "gif"
    ];

    $fileType = mime_content_type($_FILES[$field]["tmp_name"]);

    if (
        !isset($allowedTypes[$fileType]) ||
        getimagesize($_FILES[$field]["tmp_name"]) === false
    ) {
        json_response([
            "success" => false,
            "message" => "Only image files are allowed."
        ]);
    }

    // Maximum 5MB
    if ($_FILES[$field]["size"] > 5 * 1024 * 1024) {
        json_response([
            "success" => false,
            "message" => "Image must be less than 5MB."
        ]);
    }

    $fileName = "item_" .
        bin2hex(random_bytes(16)) .
        "." .
        $allowedTypes[$fileType];

    if (!move_uploaded_file(
        $_FILES[$field]["tmp_name"],
        $uploadDir . $fileName
    )) {
        json_response([
            "success" => false,
            "message" => "Failed to upload image."
        ]);
    }

    return "uploads/" . $fileName;
}


// Removes a photo file that was saved by save_uploaded_image()
function delete_uploaded_image(?string $imageUrl): void
{
    if ($imageUrl === null || $imageUrl === "") {
        return;
    }

    $fileName = basename($imageUrl);

    // Only files inside the uploads folder with our own naming
    if (!preg_match('/^item_[A-Za-z0-9.]+$/', $fileName)) {
        return;
    }

    $path = __DIR__ . "/../uploads/" . $fileName;

    if (is_file($path)) {
        unlink($path);
    }
}


// Saves a new lost or found report for the logged-in user
function create_item_report(PDO $pdo, string $type): void
{
    require_method("POST");

    // The reporter is always the logged-in user
    $userId = require_login();

    $fields = read_item_fields($_POST);

    $imageUrl = save_uploaded_image();

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
                    :type,
                    :location,
                    :latitude,
                    :longitude,
                    :item_date,
                    :description,
                    :image_url
                )";

        $stmt = $pdo->prepare($sql);

        $stmt->execute($fields + [
            ":user_id" => $userId,
            ":type" => $type,
            ":image_url" => $imageUrl
        ]);

        json_response([
            "success" => true,
            "message" => ucfirst($type) . " item reported successfully!",
            "item_id" => $pdo->lastInsertId(),
            "image_url" => $imageUrl,
            "latitude" => $fields[":latitude"],
            "longitude" => $fields[":longitude"]
        ]);

    } catch (PDOException $e) {

        error_log("Report $type item failed: " . $e->getMessage());

        // Do not keep the image if the report was not saved
        delete_uploaded_image($imageUrl);

        json_response([
            "success" => false,
            "message" => "Failed to report item. Please try again."
        ]);
    }
}


// Returns the item if the user reported it or is an admin.
// Stops with 404 / 403 otherwise.
function find_item_to_manage(PDO $pdo, ?int $itemId, int $userId): array
{
    if (!$itemId) {
        json_response([
            "success" => false,
            "message" => "Item ID is required."
        ]);
    }

    $stmt = $pdo->prepare(
        "SELECT id, user_id, title, type, status, image_url
         FROM items
         WHERE id = :id"
    );

    $stmt->execute([
        ":id" => $itemId
    ]);

    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        json_response([
            "success" => false,
            "message" => "Item not found."
        ], 404);
    }

    if ((int) $item["user_id"] !== $userId && !is_admin($pdo, $userId)) {
        json_response([
            "success" => false,
            "message" => "You can only manage your own reports."
        ], 403);
    }

    return $item;
}
