-- create database openbi default charset=utf8;
-- create user 'openbi'@'localhost' identified by 'p@ssword';
-- grant all on openbi.* to 'openbi'@'localhost';

use openbi;

drop table if exists users;
create table users (
	id				serial,
	user			nvarchar(255),
	email			nvarchar(255),
	password		 varchar(2047),
	name			nvarchar(255),
	role			nvarchar(255)
);

insert into users(user, email, name, role, password)
	values('root', 'email@email.com', 'System Administrator', 'root',
		sha2('password', 256));

drop table if exists dashboards;
create table dashboards (
	id			serial,
	user		bigint,
	name		nvarchar(1023),
	public		int default 0,
	layout		nvarchar(255),
	data_type	 varchar(255) default 'none',	-- none file url query
	data_name	nvarchar(1023),					-- original file name or name
	data		nvarchar(2047)					-- file path on server
);

/*
if (data_type == 'file') {
	data_name	is the original filename
	data		is the path on the server
}
if (data_type == 'url') {
	data_name	is the name or description of data
	data		is the url to data
}
if (data_type == 'query') {
	data_name	is the name or description of data
	data		is the query string
}
*/

drop table if exists charts;
create table charts (
	id			serial,
	dashboard	bigint,
	name		nvarchar(1023),
	x			int default 0,
	y			int default 0,
	z			int default 0,					-- reserved
	width		int default 240,
	height		int default 120,
	type		varchar(255) default 'none',	-- none, bar, line, pie
	options		longtext,						-- json format
	dimension	longtext,						-- code e.g. dc.pluck('column')
	reduce		longtext			-- code e.g. reduceSum(dc.pluck('column'))
);





/*
drop table if exists data;
create table data (
	id			 serial,
	user		 bigint,
	name		 nvarchar(1023),
	data		 longtext
);
*/

/*
drop table if exists layouts;
create table layouts (
	id				serial,
	name			nvarchar(1023),
	icon			nvarchar(1023),
	file			nvarchar(1023)
);
*/


/*
drop table if exists data_queries;
drop table if exists data_urls;
drop table if exists data_files;

create table data_queries(
	id			serial,
	queries		nvarchar(2047)
);

create table data_urls(
	id			serial,
	url			nvarchar(2047)
);

create table data_files(
	id			serial,
	user		bigint,
	name		nvarchar(255),
	original	nvarchar(1023)
);
*/


/*
NOTE:








*/
