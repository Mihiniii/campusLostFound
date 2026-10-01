<?php

// Loads the settings from config.local.php
function app_config(): array
{
    static $config = null;

    if ($config === null) {
        $file = __DIR__ . "/config.local.php";

        if (!is_file($file)) {
            error_log("config.local.php is missing. Copy config.example.php to config.local.php.");

            http_response_code(500);
            header("Content-Type: application/json");

            echo json_encode([
                "success" => false,
                "message" => "Server is not configured."
            ]);
            exit;
        }

        // Settings that are missing from config.local.php use these values
        $config = (require $file) + [
            "allowed_origin" => "http://localhost:5173",
            "mail_mode" => "log",
            "mail_from" => "no-reply@campus-lost-found.local"
        ];
    }

    return $config;
}
