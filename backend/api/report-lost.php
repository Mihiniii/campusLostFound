<?php

require_once __DIR__ . "/../config/bootstrap.php";
require_once __DIR__ . "/../config/items.php";

create_item_report($pdo, "lost");
