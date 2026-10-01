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

if (throttle_count("resend-verification", $email, $window) >= 3) {
    json_response([
        "success" => false,
        "message" => "Too many requests. Please try again in 15 minutes."
    ], 429);
}

throttle_add("resend-verification", $email, $window);

try {

    $stmt = $pdo->prepare(
        "SELECT id, name, email
         FROM users
         WHERE email = :email
           AND email_verified_at IS NULL"
    );

    $stmt->execute([
        ":email" => $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $link = null;

    if ($user) {
        $link = send_verification_email(
            $pdo,
            (int) $user["id"],
            $user["email"],
            $user["name"]
        );
    }

    // Same answer whether the account exists or not
    json_response([
        "success" => true,
        "message" => "If this account still needs verification, a new link has been sent."
    ] + dev_link($link));

} catch (PDOException $e) {

    error_log("Resend verification failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to send the verification email."
    ]);
}
