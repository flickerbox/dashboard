<?php
/**
* Core
*/
class Http Extends Core
{
	public function response($http_code = 200)
	{
		$headers = array();
		
		$codes = array(
			200 => 'OK',
			404 => 'Not Found'
		);
		
		if ($http_code == 200)
		{
			foreach ($this as $key => $value)
			{
				if ($this->$key)
				{
					$body = $this->$key;
					$http_code = 200;
					break;
				}
				else
				{
					$http_code = 404;
				}
			}
		}
		
		$headers[] = 'HTTP/1.1 ' . $http_code . ' ' . $codes[$http_code];
		
		switch ($http_code)
		{
			case 200:
				$headers[] = 'Cache-Control: no-cache, no-store, must-revalidate, pre-check=0, post-check=0';
				$headers[] = 'Expires: Fri, 02 Apr 2010 16:55:40 GMT';
				$headers[] = 'Content-type: application/json; charset=utf-8';
				$headers[] = 'Pragma: no-cache';
				$body = (isset($body)) ? json_encode($body) : '';
				break;
			case 404:
				$body = '<h1>404 - Not Found</h1>';
				break;
		}
		
		foreach ($headers as $header)
		{
			header($header);
		}
		print ($body) ? $body : '';
		exit;
	}

}

