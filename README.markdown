Dashboard
=========

![Dashboard Screenshot](https://raw.githubusercontent.com/flickerbox/dashboard/master/screenshot.png)

By Ben Ubois. Design by Todd J. Collins.

Dashboard is a view for the [Mantis Bug Tracker](http://www.mantisbt.org/). It features:

* An average age of bugs graph
* Number of bugs assigned by user
* Oldest bugs list
* Top opener/closer for the day
* A priority bugs alert for any block, major or crash bug

The average age graph calculates the average age of all _open_ bugs. 

Installation
------------

Dashboard is meant to be run on and Apache web server with PHP > 5 and PDO support. It is best viewed in Chrome, but also works alright in FireFox. It is designed to be displayed on a 1080p TV, but also works well as a Web Clip item on Mac OS X or viewed in a browser.

A simple table is required for keeping track of the average age of bugs. Here is the MySQL necessary to create this table:

	CREATE TABLE `bugs_average` (
		`id` int(11) NOT NULL AUTO_INCREMENT,
		`date` date DEFAULT NULL,
		`average` int(11) DEFAULT NULL,
		PRIMARY KEY (`id`),
		UNIQUE KEY `date` (`date`)
	) ENGINE=MyISAM AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

Add your Mantis and Dashboard database settings to api/_config.php. You also need to add a list of Mantis usernames you want to be included on the Dashboard as well as any project ids you want to exclude.

About
-----

Dashboard is separated into a PHP data layer with a JSON API interface and a JavaScript front end. This separation makes it easy for the data to be kept up-to-date as the JavaScript will make XMLHttpRequests every 30 seconds and update the data without requiring a page refresh. 

Dashboard uses the excellent jQuery JavaScript library.
