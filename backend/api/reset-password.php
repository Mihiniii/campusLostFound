<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/account.php";

require_method("POST");

$data = read_json();

$token = (string) ($data["token"] ?? "");
$password = (string) ($data["password"] ?? "");

if (!valid_password($password)) {
    json_response([
        "success" => false,
        "message" => PASSWORD_RULE_MESSAGE
    ]);
}

try {

    $row = find_user_token($pdo, $token, "reset_password");

    if (!$row) {
        json_response([
            "success" => false,
            "message" => "This reset link is not valid or has expired. Please ask for a new one."
        ]);
    }

    $pdo->beginTransaction();

    // Opening the link also proves the user owns the email address
    $stmt = $pdo->prepare(
        "UPDATE users
         SET password = :password,
             email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
         WHERE id = :id"
    );

    $stmt->execute([
        ":password" => password_hash($password, PASSWORD_DEFAULT),
        ":id" => $row["user_id"]
    ]);

    use_user_token($pdo, (int) $row["id"]);

    $pdo->commit();

    json_response([
        "success" => true,
        "message" => "Password changed! You can now log in."
    ]);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Reset password failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to reset password."
    ]);
}
