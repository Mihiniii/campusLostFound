<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/account.php";

require_method("POST");

$data = read_json();

$email = trim((string) ($data["email"] ?? ""));

if ($email === "") {
    json_response([
        "success" => false,
        "message" => "Email is required."
    ]);
}

// Limit: 3 emails per 15 minutes for each email + IP address
$window = 15 * 60;

if (throttle_count("forgot-password", $email, $window) >= 3) {
    json_response([
        "success" => false,
        "message" => "Too many requests. Please try again in 15 minutes."
    ], 429);
}

throttle_add("forgot-password", $email, $window);

try {

    $stmt = $pdo->prepare(
        "SELECT id, name, email
         FROM users
         WHERE email = :email"
    );

    $stmt->execute([
        ":email" => $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $link = null;

    if ($user) {
        $link = send_password_reset_email(
            $pdo,
            (int) $user["id"],
            $user["email"],
            $user["name"]
        );
    }

    // Same answer whether the account exists or not
    json_response([
        "success" => true,
        "message" => "If an account exists for this email, a password reset link has been sent."
    ] + dev_link($link));

} catch (PDOException $e) {

    error_log("Forgot password failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to send the reset email."
    ]);
}
