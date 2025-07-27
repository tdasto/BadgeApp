<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'id' => rand(1000, 9999),
            'badge_number' => $input['badge_number'] ?? '',
            'g_first_name' => $input['g_first_name'] ?? '',
            'g_last_name' => $input['g_last_name'] ?? '',
            'g_city' => $input['g_city'] ?? '',
            'g_state' => $input['g_state'] ?? '',
            'g_yob' => $input['g_yob'] ?? '',
            'time_in' => $input['time_in'] ?? date('Y-m-d H:i:s'),
            'visitor_type' => $input['visitor_type'] ?? 'shooter',
            'created_at' => date('Y-m-d H:i:s')
        ],
        'message' => 'Guest registered successfully'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
}
?>
