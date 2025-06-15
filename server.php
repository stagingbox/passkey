<?php
session_start();
$db = new SQLite3('users.db');

// Check if the table exists
$stmt = $db->prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
$result = $stmt->execute()->fetchArray();

if (!$result) {
    // Create the table if it doesn't exist
    $db->exec("CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        credential_id TEXT UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        email TEXT NOT NULL,
        username TEXT NOT NULL
    )");
}

header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);
$action = $data['action'] ?? '';

if ($action === 'getChallenge') {
    //$challenge = bin2hex(random_bytes(32));
    //$_SESSION['challenge'] = $challenge;
    //echo json_encode(['challenge' => base64_encode($challenge)]);
    $challenge = random_bytes(32); // Generate raw binary challenge
    $_SESSION['challenge'] = base64_encode($challenge); // Store encoded challenge
    echo json_encode(['challenge' => base64_encode($challenge)]);

} elseif ($action === 'register') {
    $credentialId = $data['credentialId'];
    $publicKey = $data['publicKey'];
    $email = $data['email'];
    $username = $data['username'];

    $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE credential_id = ?");
    $stmt->bindValue(1, $credentialId);
    $count = $stmt->execute()->fetchArray()[0];

    if ($count == 0) {
        $stmt = $db->prepare("INSERT INTO users (credential_id, public_key, email, username) VALUES (?, ?, ?, ?)");
        $stmt->bindValue(1, $credentialId);
        $stmt->bindValue(2, $publicKey);
        $stmt->bindValue(3, $email);
        $stmt->bindValue(4, $username);
        $stmt->execute();
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Passkey already exists']);
    }
} elseif ($action === 'login') {
    $credentialId = $data['credentialId'];

    $stmt = $db->prepare("SELECT * FROM users WHERE credential_id = ?");
    $stmt->bindValue(1, $credentialId);
    $result = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

    if ($result) {
        $_SESSION['authenticated'] = true;
        $_SESSION['user_id'] = $result['id']; // Store user ID
        $_SESSION['email'] = $result['email']; // Store email
        $_SESSION['username'] = $result['username']; // Store username
        echo json_encode(['success' => true, 'session' => $_SESSION]);
    } else {
        echo json_encode(['success' => false]);
    }
}
