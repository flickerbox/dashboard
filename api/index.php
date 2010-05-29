<?php
define('DOCUMENT_ROOT', dirname(dirname(__FILE__)));
require(DOCUMENT_ROOT . '/api/_config.php');
require(DOCUMENT_ROOT . '/api/class.core.php');
require(DOCUMENT_ROOT . '/api/class.http.php');
require(DOCUMENT_ROOT . '/api/class.bugs.php');

$request = $_GET['request'];
$request = explode('/', $request);

switch ($request[0]) {
	case 'bugs':
		if (Core::validate_request('Bugs', $request))
		{
			$bugs = new Bugs;
			$bugs->{$request[1]}()->response();
		}
		else
		{
			Http::response(404);
		}
		break;
	default:
		Http::response(404);
}
?>
