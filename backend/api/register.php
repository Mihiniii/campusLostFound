<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once __DIR__ . "/../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

// Required field validation
if ($name === "" || $email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
    exit;
}

// Password validation
if (
    strlen($password) < 8 ||
    !preg_match('/[A-Z]/', $password) ||
    !preg_match('/[a-z]/', $password) ||
    !preg_match('/[0-9]/', $password)
) {
    echo json_encode([
        "success" => false,
        "message" => "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number."
    ]);
    exit;
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {

    $sql = "INSERT INTO users (name, email, password)
            VALUES (:name, :email, :password)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ":name" => $name,
        ":email" => $email,
        ":password" => $hashedPassword
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Account created successfully!"
    ]);

} catch (PDOException $e) {

    if ($e->getCode() === "23505") {
        echo json_encode([
            "success" => false,
            "message" => "Email already exists."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Registration failed."
        ]);
    }
}