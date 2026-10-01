<?php

// Gives a user the admin role.
// Run from the project root:  php backend/make-admin.php someone@example.com

if (PHP_SAPI !== "cli") {
    http_response_code(404);
    exit;
}

require_once __DIR__ . "/config/database.php";

$email = $argv[1] ?? "";

if ($email === "") {
    echo "Usage: php backend/make-admin.php <email>\n";
    exit(1);
}

$stmt = $pdo->prepare(
    "UPDATE users SET role = 'admin' WHERE email = :email"
);

$stmt->execute([
    ":email" => $email
]);

if ($stmt->rowCount() === 0) {
    echo "No user found with that email.\n";
    exit(1);
}

echo "$email is now an admin. They must log in again to see the Admin page.\n";
