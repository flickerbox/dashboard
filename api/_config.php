<?php
$GLOBALS['config'] = array(
	'dashboard' => array(
		'db' => array('mysql:host=127.0.0.1;dbname=DATABASE','USER','PASSWORD'),
	),
	'mantis' => array(
		'db'                => array('mysql:host=127.0.0.1;dbname=DATABASE','USER','PASSWORD'),
		'excluded_projects' => '1, 2, 3',
		'employees'         => "'USERNAME', 'USERNAME'",
	),
);

