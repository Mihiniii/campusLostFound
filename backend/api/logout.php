<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("POST");

// Remove the session data and the session cookie
$_SESSION = [];

$cookie = session_get_cookie_params();

setcookie(session_name(), "", [
    "expires" => time() - 3600,
    "path" => $cookie["path"],
    "httponly" => $cookie["httponly"],
    "secure" => $cookie["secure"],
    "samesite" => $cookie["samesite"]
]);

session_destroy();

json_response([
    "success" => true,
    "message" => "Logged out."
]);
