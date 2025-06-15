<?php
session_start();
$db = new SQLite3('users.db');

header('Content-Type: application/json');

// Fetch all users
$results = $db->query("SELECT id, credential_id, email, username FROM users");

$users = [];
while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
    $users[] = $row;
}

$data = [
    'users' => $users,
    'session' => $_SESSION
];

echo json_encode($data, JSON_PRETTY_PRINT);
