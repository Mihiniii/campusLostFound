<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("POST");

$data = read_json();

$email = trim((string) ($data["email"] ?? ""));
$password = (string) ($data["password"] ?? "");

if ($email === "" || $password === "") {
    json_response([
        "success" => false,
        "message" => "Email and password are required."
    ]);
}


// Limit wrong password attempts: 5 per 15 minutes for each email + IP address
$maxAttempts = 5;
$attemptWindow = 15 * 60;

if (throttle_count("login", $email, $attemptWindow) >= $maxAttempts) {
    json_response([
        "success" => false,
        "message" => "Too many login attempts. Please try again in 15 minutes."
    ], 429);
}


try {

    $stmt = $pdo->prepare(
        "SELECT id, name, email, password, role, email_verified_at
         FROM users
         WHERE email = :email"
    );

    $stmt->execute([
        "email" => $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user["password"])) {

        throttle_add("login", $email, $attemptWindow);

        json_response([
            "success" => false,
            "message" => "Invalid email or password."
        ]);
    }

    throttle_clear("login", $email);

    // The email address must be verified before the first login
    if ($user["email_verified_at"] === null) {
        json_response([
            "success" => false,
            "needs_verification" => true,
            "message" => "Please verify your email address before logging in."
        ]);
    }

    unset($user["password"], $user["email_verified_at"]);

    // New session ID on login, so an old session ID cannot be reused
    session_regenerate_id(true);

    $_SESSION["user_id"] = (int) $user["id"];

    json_response([
        "success" => true,
        "message" => "Login successful!",
        "user" => $user
    ]);

} catch (PDOException $e) {

    error_log("Login failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Login failed."
    ]);
}
