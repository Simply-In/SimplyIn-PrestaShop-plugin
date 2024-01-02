<?php


require(dirname(__FILE__).'/../../../config/config.inc.php');
require(dirname(__FILE__) . '/../../../init.php');


$data = json_decode(file_get_contents("php://input"), true);
$endpoint = $data['endpoint'];
$method = strtoupper($data['method']);
$body = $data['requestBody'];
$token = $data['token'];


$apiKey = Configuration::get('SIMPLYIN_SECRET_KEY');
$body['api_token'] = $apiKey;

if (!empty($token)) {
	$url = 'https://prod.backend.simplyin.app/' . $endpoint . '?api_token=' . urlencode($token);
} else {
	$url = 'https://prod.backend.simplyin.app/' . $endpoint;
}

$headers = array('Content-Type: application/json');
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);

switch ($method) {
    case 'GET':
        curl_setopt($ch, CURLOPT_HTTPGET, 1);
        break;
    case 'POST':
        curl_setopt($ch, CURLOPT_POST, 1);
        break;
    case 'PATCH':
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        break;
    default:
        break;
}

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

curl_close($ch);

echo $response;

?>