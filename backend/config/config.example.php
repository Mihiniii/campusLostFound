<?php

// Copy this file to config.local.php and fill in your own values.
// config.local.php is ignored by git, so real passwords stay off the repository.

return [
    "db_host" => "localhost",
    "db_port" => "5432",
    "db_name" => "campusLostFound",
    "db_user" => "postgres",
    "db_password" => "",

    // The address the frontend runs on. Only this origin may call the API.
    "allowed_origin" => "http://localhost:5173",

    // How verification and password reset emails are sent:
    //   "log"  - development. No email is sent. The email is written to
    //            storage/mail.log and the link is also shown in the browser.
    //   "mail" - production. Sent with PHP's mail() function.
    "mail_mode" => "log",
    "mail_from" => "no-reply@campus-lost-found.local",
];
