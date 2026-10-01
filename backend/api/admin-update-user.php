<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("POST");

$adminId = require_admin($pdo);

$data = read_json();

$userId = positive_int($data["user_id"] ?? null);
$role = (string) ($data["role"] ?? "");

if (!$userId || !in_array($role, ["student", "admin"], true)) {
    json_response([
        "success" => false,
        "message" => "User and a valid role are required."
    ]);
}

// An admin cannot remove their own admin role,
// so there is always at least one admin left
if ($userId === $adminId) {
    json_response([
        "success" => false,
        "message" => "You cannot change your own role."
    ]);
}

try {

    $stmt = $pdo->prepare(
        "UPDATE users
         SET role = :role
         WHERE id = :id"
    );

    $stmt->execute([
        ":role" => $role,
        ":id" => $userId
    ]);

    if ($stmt->rowCount() === 0) {
        json_response([
            "success" => false,
            "message" => "User not found."
        ], 404);
    }

    json_response([
        "success" => true,
        "message" => "Role updated."
    ]);

} catch (PDOException $e) {

    error_log("Admin update user failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to update user."
    ]);
}
