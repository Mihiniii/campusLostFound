<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("GET");

require_admin($pdo);

try {

    $sql = "SELECT
                users.id,
                users.name,
                users.email,
                users.role,
                users.created_at,
                users.email_verified_at IS NOT NULL AS email_verified,
                (
                    SELECT COUNT(*)
                    FROM items
                    WHERE items.user_id = users.id
                ) AS item_count
            FROM users
            ORDER BY users.id";

    $stmt = $pdo->query($sql);

    json_response([
        "success" => true,
        "users" => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (PDOException $e) {

    error_log("Admin users failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to load users."
    ]);
}
