<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$badge_number = end($pathParts);

if ($badge_number == '123' || $badge_number == '12345') {
    echo json_encode([
        'status' => 'success',
        'data' => [
            'badge_number' => $badge_number,
            'prefix' => 'Mr.',
            'suffix' => '',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'address' => '123 Main St',
            'city' => 'Anytown',
            'state' => 'TX',
            'zip' => '12345',
            'ice_phone' => '555-123-4567',
            'mem_type' => 'Regular',
            'isExpired' => false
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Badge holder not found'
    ]);
}
?>
