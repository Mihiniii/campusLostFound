<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/account.php";

require_method("POST");

$data = read_json();

$name = trim((string) ($data["name"] ?? ""));
$email = trim((string) ($data["email"] ?? ""));
$password = (string) ($data["password"] ?? "");

// Required field validation
if ($name === "" || $email === "" || $password === "") {
    json_response([
        "success" => false,
        "message" => "All fields are required."
    ]);
}

// Length validation
if (mb_strlen($name) > 100 || mb_strlen($email) > 150) {
    json_response([
        "success" => false,
        "message" => "Name or email is too long."
    ]);
}

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
}

// Password validation
if (!valid_password($password)) {
    json_response([
        "success" => false,
        "message" => PASSWORD_RULE_MESSAGE
    ]);
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {

    $pdo->beginTransaction();

    $sql = "INSERT INTO users (name, email, password)
            VALUES (:name, :email, :password)
            RETURNING id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":name" => $name,
        ":email" => $email,
        ":password" => $hashedPassword
    ]);

    $userId = (int) $stmt->fetchColumn();

    // The account can be used after the email address is verified
    $link = send_verification_email($pdo, $userId, $email, $name);

    $pdo->commit();

    json_response([
        "success" => true,
        "message" => "Account created! Check your email for a link to verify your address."
    ] + dev_link($link));

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($e->getCode() === "23505") {
        json_response([
            "success" => false,
            "message" => "Email already exists."
        ]);
    }

    error_log("Register failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Registration failed."
    ]);
}
