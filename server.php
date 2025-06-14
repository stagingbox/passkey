<?php
session_start();
$db = new SQLite3('users.db');

// Check if the table exists
$stmt = $db->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
$result = $stmt->execute()->fetchArray();

if (!$result) {
    // Create table only if it doesn't exist
    $stmt = $db->prepare("CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        credential_id TEXT UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT
    )");
    $stmt->execute();
}

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

if ($action === 'checkAuth') {
    echo json_encode(['authenticated' => isset($_SESSION['authenticated'])]);
} elseif ($action === 'register') {
    $credentialId = $data['credentialId'];
    $publicKey = $data['publicKey'];

    // Ensure credential_id does not exist before inserting
    $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE credential_id = ?");
    $stmt->bindValue(1, $credentialId);
    $count = $stmt->execute()->fetchArray()[0];

    if ($count == 0) {
        $stmt = $db->prepare("INSERT INTO users (credential_id, public_key) VALUES (?, ?)");
        $stmt->bindValue(1, $credentialId);
        $stmt->bindValue(2, $publicKey);
        $stmt->execute();
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Passkey already exists']);
    }
} elseif ($action === 'login') {
    $credentialId = $data['credentialId'];
    $stmt = $db->prepare("SELECT public_key FROM users WHERE credential_id = ?");
    $stmt->bindValue(1, $credentialId);
    $result = $stmt->execute()->fetchArray();

    if ($result) {
        $_SESSION['authenticated'] = true;
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
}
