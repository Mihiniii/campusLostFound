<?php

require_once __DIR__ . "/../config/bootstrap.php";

require_method("POST");

$userId = require_login();

$data = read_json();

$claimId = positive_int($data["claim_id"] ?? null);
$status = (string) ($data["status"] ?? "");

if (!$claimId || !in_array($status, ["accepted", "rejected"], true)) {
    json_response([
        "success" => false,
        "message" => "Claim and a valid decision are required."
    ]);
}

try {

    $stmt = $pdo->prepare(
        "SELECT
            claims.id,
            claims.user_id AS claimant_id,
            claims.status,
            items.id AS item_id,
            items.user_id AS owner_id,
            items.title
         FROM claims
         JOIN items
            ON claims.item_id = items.id
         WHERE claims.id = :id"
    );

    $stmt->execute([
        ":id" => $claimId
    ]);

    $claim = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$claim) {
        json_response([
            "success" => false,
            "message" => "Claim not found."
        ], 404);
    }

    // Only the person who reported the item decides on its claims
    if ((int) $claim["owner_id"] !== $userId) {
        json_response([
            "success" => false,
            "message" => "You can only answer claims on your own reports."
        ], 403);
    }

    if ($claim["status"] !== "pending") {
        json_response([
            "success" => false,
            "message" => "This claim has already been answered."
        ]);
    }

    $pdo->beginTransaction();

    $updateClaim = $pdo->prepare(
        "UPDATE claims
         SET status = :status
         WHERE id = :id"
    );

    // The claimant is told about the decision with a message in their inbox
    $notify = $pdo->prepare(
        "INSERT INTO messages (sender_id, receiver_id, item_id, message)
         VALUES (:sender_id, :receiver_id, :item_id, :message)"
    );

    $updateClaim->execute([
        ":status" => $status,
        ":id" => $claimId
    ]);

    $notify->execute([
        ":sender_id" => $userId,
        ":receiver_id" => $claim["claimant_id"],
        ":item_id" => $claim["item_id"],
        ":message" => $status === "accepted"
            ? "Your claim on \"" . $claim["title"] . "\" was accepted. Reply here to arrange the handover."
            : "Your claim on \"" . $claim["title"] . "\" was not accepted."
    ]);

    if ($status === "accepted") {

        // The item is settled: close it and turn down the other open claims
        $closeItem = $pdo->prepare(
            "UPDATE items
             SET status = 'returned'
             WHERE id = :id"
        );

        $closeItem->execute([
            ":id" => $claim["item_id"]
        ]);

        $others = $pdo->prepare(
            "SELECT id, user_id
             FROM claims
             WHERE item_id = :item_id
               AND status = 'pending'"
        );

        $others->execute([
            ":item_id" => $claim["item_id"]
        ]);

        foreach ($others->fetchAll(PDO::FETCH_ASSOC) as $other) {

            $updateClaim->execute([
                ":status" => "rejected",
                ":id" => $other["id"]
            ]);

            if ((int) $other["user_id"] !== (int) $claim["claimant_id"]) {
                $notify->execute([
                    ":sender_id" => $userId,
                    ":receiver_id" => $other["user_id"],
                    ":item_id" => $claim["item_id"],
                    ":message" => "Your claim on \"" . $claim["title"] . "\" was not accepted."
                ]);
            }
        }
    }

    $pdo->commit();

    json_response([
        "success" => true,
        "message" => $status === "accepted"
            ? "Claim accepted. The item is now marked as returned."
            : "Claim rejected."
    ]);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Update claim failed: " . $e->getMessage());

    json_response([
        "success" => false,
        "message" => "Failed to update claim."
    ]);
}
