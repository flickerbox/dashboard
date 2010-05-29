<?php
require($_SERVER['DOCUMENT_ROOT'] . '/api/class.core.php');
require($_SERVER['DOCUMENT_ROOT'] . '/api/class.bugs.php');

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
			Core::response();
		}
		break;
	default:
		Core::response();
}
?>
