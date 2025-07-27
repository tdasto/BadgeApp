<?php
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mockGuests = [
        [
            'id' => 1001,
            'badge_number' => '123',
            'g_first_name' => 'Jane',
            'g_last_name' => 'Smith',
            'g_city' => 'Dallas',
            'g_state' => 'TX',
            'g_yob' => '1995',
            'time_in' => '2025-07-11 19:20:17',
            'time_out' => null,
            'visitor_type' => 'shooter',
            'payment_status' => 'pending',
            'created_at' => '2025-07-11 19:20:17'
        ],
        [
            'id' => 1002,
            'badge_number' => '456',
            'g_first_name' => 'Bob',
            'g_last_name' => 'Johnson',
            'g_city' => 'Austin',
            'g_state' => 'TX',
            'g_yob' => '1988',
            'time_in' => '2025-07-11 18:45:30',
            'time_out' => '2025-07-11 19:15:45',
            'visitor_type' => 'observer',
            'payment_status' => 'paid',
            'created_at' => '2025-07-11 18:45:30'
        ]
    ];
    
    echo json_encode([
        'status' => 'success',
        'data' => $mockGuests,
        'total' => count($mockGuests)
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Method not allowed'
    ]);
}
?>
