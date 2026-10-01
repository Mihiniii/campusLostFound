<?php

// Helpers for account emails: verification and password reset links.

const VERIFY_EMAIL_MINUTES = 24 * 60;
const RESET_PASSWORD_MINUTES = 60;


// Sends an email, or writes it to storage/mail.log in development
function send_app_mail(string $to, string $subject, string $body): void
{
    $config = app_config();

    if ($config["mail_mode"] === "mail") {

        $sent = mail(
            $to,
            $subject,
            $body,
            "From: " . $config["mail_from"]
        );

        if (!$sent) {
            error_log("Failed to send email to " . $to);
        }

        return;
    }

    // The log is kept outside the backend folder so it is not served by the web server
    $dir = __DIR__ . "/../../storage";

    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
        file_put_contents($dir . "/.htaccess", "Require all denied\n");
    }

    file_put_contents(
        $dir . "/mail.log",
        "[" . date("Y-m-d H:i:s") . "]\nTo: $to\nSubject: $subject\n\n$body\n\n" . str_repeat("-", 60) . "\n",
        FILE_APPEND | LOCK_EX
    );
}


// In development the link is also returned to the browser,
// because no real email is sent
function dev_link(?string $link): array
{
    if ($link === null || app_config()["mail_mode"] !== "log") {
        return [];
    }

    return ["dev_link" => $link];
}


// Creates a one-time token for a user and returns it.
// Only a hash of the token is stored in the database.
function create_user_token(PDO $pdo, int $userId, string $type, int $minutes): string
{
    // Older unused links of the same type stop working
    $stmt = $pdo->prepare(
        "DELETE FROM user_tokens
         WHERE user_id = :user_id
           AND type = :type
           AND used_at IS NULL"
    );

    $stmt->execute([
        ":user_id" => $userId,
        ":type" => $type
    ]);

    $token = bin2hex(random_bytes(32));

    $stmt = $pdo->prepare(
        "INSERT INTO user_tokens (user_id, type, token_hash, expires_at)
         VALUES (
            :user_id,
            :type,
            :token_hash,
            CURRENT_TIMESTAMP + make_interval(mins => CAST(:minutes AS integer))
         )"
    );

    $stmt->execute([
        ":user_id" => $userId,
        ":type" => $type,
        ":token_hash" => hash("sha256", $token),
        ":minutes" => $minutes
    ]);

    return $token;
}


// Returns the token row if the token is valid, unused and not expired
function find_user_token(PDO $pdo, string $token, string $type): ?array
{
    if ($token === "") {
        return null;
    }

    $stmt = $pdo->prepare(
        "SELECT id, user_id
         FROM user_tokens
         WHERE token_hash = :token_hash
           AND type = :type
           AND used_at IS NULL
           AND expires_at > CURRENT_TIMESTAMP"
    );

    $stmt->execute([
        ":token_hash" => hash("sha256", $token),
        ":type" => $type
    ]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}


function use_user_token(PDO $pdo, int $tokenId): void
{
    $stmt = $pdo->prepare(
        "UPDATE user_tokens
         SET used_at = CURRENT_TIMESTAMP
         WHERE id = :id"
    );

    $stmt->execute([
        ":id" => $tokenId
    ]);
}


// Emails a link to confirm the email address. Returns the link.
function send_verification_email(PDO $pdo, int $userId, string $email, string $name): string
{
    $token = create_user_token($pdo, $userId, "verify_email", VERIFY_EMAIL_MINUTES);

    $link = app_config()["allowed_origin"] . "/verify-email?token=" . $token;

    send_app_mail(
        $email,
        "Verify your Campus Lost & Found email",
        "Hi $name,\n\n" .
        "Open this link to verify your email address:\n$link\n\n" .
        "The link works for 24 hours. If you did not create this account, ignore this email."
    );

    return $link;
}


// Emails a link to choose a new password. Returns the link.
function send_password_reset_email(PDO $pdo, int $userId, string $email, string $name): string
{
    $token = create_user_token($pdo, $userId, "reset_password", RESET_PASSWORD_MINUTES);

    $link = app_config()["allowed_origin"] . "/reset-password?token=" . $token;

    send_app_mail(
        $email,
        "Reset your Campus Lost & Found password",
        "Hi $name,\n\n" .
        "Open this link to choose a new password:\n$link\n\n" .
        "The link works for 1 hour. If you did not ask for this, ignore this email."
    );

    return $link;
}
