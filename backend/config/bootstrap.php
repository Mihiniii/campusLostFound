<?php

// Shared setup for every API endpoint:
// CORS headers, session, database connection and helper functions.

require_once __DIR__ . "/config.php";

$config = app_config();

header("Content-Type: application/json");
header("X-Content-Type-Options: nosniff");
header("Access-Control-Allow-Origin: " . $config["allowed_origin"]);
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Vary: Origin");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}


// Send a JSON response and stop
function json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}


// Block requests that change data when they come from another website (CSRF)
$origin = $_SERVER["HTTP_ORIGIN"] ?? null;

if (
    $_SERVER["REQUEST_METHOD"] !== "GET" &&
    $origin !== null &&
    $origin !== $config["allowed_origin"]
) {
    json_response([
        "success" => false,
        "message" => "Request not allowed."
    ], 403);
}


// Session: the login is kept in a cookie that JavaScript cannot read
$isHttps = !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off";

ini_set("session.use_strict_mode", "1");
ini_set("session.use_only_cookies", "1");

session_name("clf_session");

session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "httponly" => true,
    "secure" => $isHttps,
    "samesite" => "Lax"
]);

session_start();

// Log out after 2 hours without any request
$sessionTimeout = 2 * 60 * 60;

if (
    isset($_SESSION["last_activity"]) &&
    time() - $_SESSION["last_activity"] > $sessionTimeout
) {
    $_SESSION = [];
    session_regenerate_id(true);
}

$_SESSION["last_activity"] = time();


// Only allow the given request method
function require_method(string $method): void
{
    if ($_SERVER["REQUEST_METHOD"] !== $method) {
        json_response([
            "success" => false,
            "message" => "Method not allowed."
        ], 405);
    }
}


// Returns the logged-in user's ID, or stops with 401
function require_login(): int
{
    if (empty($_SESSION["user_id"])) {
        json_response([
            "success" => false,
            "message" => "Please login to continue."
        ], 401);
    }

    return (int) $_SESSION["user_id"];
}


// Read the JSON request body
function read_json(): array
{
    $data = json_decode(file_get_contents("php://input"), true);

    return is_array($data) ? $data : [];
}


// Returns a positive whole number, or null if the value is not one
function positive_int($value): ?int
{
    $int = filter_var($value, FILTER_VALIDATE_INT, [
        "options" => ["min_range" => 1]
    ]);

    return $int === false ? null : $int;
}


// Checks a date in YYYY-MM-DD format
function valid_date(string $value): bool
{
    $date = DateTime::createFromFormat("Y-m-d", $value);

    return $date !== false && $date->format("Y-m-d") === $value;
}


// Password rule: 8 to 72 characters with an uppercase letter,
// a lowercase letter and a number.
// (bcrypt only uses the first 72 bytes, so longer passwords are rejected)
function valid_password(string $password): bool
{
    return strlen($password) >= 8 &&
        strlen($password) <= 72 &&
        preg_match('/[A-Z]/', $password) &&
        preg_match('/[a-z]/', $password) &&
        preg_match('/[0-9]/', $password);
}

const PASSWORD_RULE_MESSAGE = "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.";


/*
|--------------------------------------------------------------------------
| Attempt limits
|--------------------------------------------------------------------------
| Counts attempts for an action (login, password reset...) so the same
| email + IP address cannot repeat it too often.
|--------------------------------------------------------------------------
*/

function throttle_file(string $action, string $key): string
{
    $dir = sys_get_temp_dir() . "/clf_attempts";

    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }

    return $dir . "/" . hash(
        "sha256",
        $action . "|" . strtolower($key) . "|" . ($_SERVER["REMOTE_ADDR"] ?? "")
    ) . ".json";
}

// Number of attempts in the last $window seconds
function throttle_count(string $action, string $key, int $window): int
{
    $file = throttle_file($action, $key);

    if (!is_file($file)) {
        return 0;
    }

    $attempts = json_decode(file_get_contents($file), true) ?: [];

    return count(array_filter(
        $attempts,
        fn($time) => $time > time() - $window
    ));
}

function throttle_add(string $action, string $key, int $window): void
{
    $file = throttle_file($action, $key);

    $attempts = is_file($file)
        ? (json_decode(file_get_contents($file), true) ?: [])
        : [];

    $attempts = array_values(array_filter(
        $attempts,
        fn($time) => $time > time() - $window
    ));

    $attempts[] = time();

    file_put_contents($file, json_encode($attempts), LOCK_EX);
}

function throttle_clear(string $action, string $key): void
{
    $file = throttle_file($action, $key);

    if (is_file($file)) {
        unlink($file);
    }
}


require_once __DIR__ . "/database.php";


// Returns the logged-in user's ID, or null for a visitor
function current_user_id(): ?int
{
    return empty($_SESSION["user_id"]) ? null : (int) $_SESSION["user_id"];
}


// The role is read from the database each time, so a role change
// takes effect without waiting for the user to log in again
function is_admin(PDO $pdo, int $userId): bool
{
    $stmt = $pdo->prepare(
        "SELECT role FROM users WHERE id = :id"
    );

    $stmt->execute([
        ":id" => $userId
    ]);

    return $stmt->fetchColumn() === "admin";
}


// Returns the logged-in admin's ID, or stops with 401 / 403
function require_admin(PDO $pdo): int
{
    $userId = require_login();

    if (!is_admin($pdo, $userId)) {
        json_response([
            "success" => false,
            "message" => "Admin access only."
        ], 403);
    }

    return $userId;
}
