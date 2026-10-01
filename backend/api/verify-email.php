<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/account.php";

require_method("POST");

$data = read_json();

$token = (string) ($data["token"] ?? "");

try {

    $row = find_user_token($pdo, $token, "verify_email");

    if (!$row) {
        json_response([
            "success" => false,
            "message" => "This verification link is not valid or has expired. Log in to get a new one."
        ]);
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        "UPDATE users
         SET email_verified_at = CURRENT_TIMESTAMP
         WHERE id = :id"
    );

    $stmt->execute([
        ":id" => $row["user_id"]
    ]);

    use_user_token($pdo, (int) $row["id"]);

    $pdo->commit();

    json_response([
        "success" => true,
        "message" => "Email verified! You can now log in."
    ]);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Verify email failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to verify email."
    ]);
}
