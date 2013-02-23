<?php
class Core
{
	private static $instance;
	
	protected $mantis;
	protected $dashboard;

	public function __construct () 
	{
		$this->dashboard = new stdClass;
		$this->mantis = new stdClass;
		
		$dashboard_db = $GLOBALS['config']['dashboard']['db'];
		$this->dashboard->db = new PDO($dashboard_db[0],$dashboard_db[1],$dashboard_db[2]);
		
		$mantis_db = $GLOBALS['config']['mantis']['db'];
		$this->mantis->db = new PDO($mantis_db[0],$mantis_db[1],$mantis_db[2]);
		
		$this->mantis->config = array(
			'excluded_projects' => $GLOBALS['config']['mantis']['excluded_projects'],
			'employees'         => $GLOBALS['config']['mantis']['employees'],
		);
	}

	public static function getInstance()
	{
		if(!isset(self::$instance))
		{
			$object = __CLASS__;
			self::$instance = new $object;
		}
		return self::$instance;
	}
	
	
	public static function validate_request($class, $request)
	{
		$methods = get_class_methods($class);

		if (in_array($request[1], $methods))
		{
			$retval = TRUE;
		}
		else
		{
			$retval = FALSE;
		}
		
		return $retval;
		
	}
	
}