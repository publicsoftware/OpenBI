create database openbi default charset=utf8;
create user 'openbi'@'localhost' identified by 'p@ssword';
grant all on openbi.* to 'openbi'@'localhost';
-- set password for 'openbi'@'localhost' = password('');

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
insert into users(user, email, name, role, password)
	values('user', 'email@email.com', 'User', 'user',
		sha2('user', 256));

drop table if exists documents;
create table documents (
	id			serial,
	user		bigint,
	name		nvarchar(1023),
	public		int default 0,
	style		nvarchar(16383),				-- custom css styling
	data_type	 varchar(255) default 'none',	-- none, file, url, query, yql
	data_name	nvarchar(1023),					-- original file name or name
	data		longtext,						-- file path on server
	init		longtext						-- data preparation code
);

/*
if (data_type == 'file') {
	data_name	is the original filename
	data		is the path on the server
}
if (data_type == 'url') {
	data_name	is the field name inside data variable
	data		is the url to data
}
if (data_type == 'query') {
	data_name	is the name or description of data
	data		is the query string
}
if (data_type == 'code') {
	data_name	is the description of data
	data		is the code to load and return data
}
*/

drop table if exists objects;
create table objects (
	id			serial,
	document	bigint,
	name		nvarchar(1023),
	x			int default 0,
	y			int default 0,
	z			int default 0,					-- z-index, reserved
	width		int default 240,
	height		int default 120,
	style		nvarchar(16383),				-- custom css styling
	type		varchar(255) default 'none',	-- none, bar, line, pie, row
	options		longtext,						-- json format for the chart
	dimension	longtext,						-- code e.g. dc.pluck('column')
	reduce		longtext,			-- code e.g. reduceSum(dc.pluck('column'))
	sort		varchar(255) default '',		-- none, asc, desc
	top			varchar(255) default '',		-- top or bottom
	top_value	bigint default 0,
	maximize_width	int default 0,
	maximize_height	int default 0
);

drop table if exists data;
create table data (
	id			serial,
	user		bigint,
	name		nvarchar(1023),
	data		longtext,
	url			nvarchar(2047),
	field		nvarchar(1023)
);

/*
drop table if exists themes;
create table themes (
	id			serial,
	name		nvarchar(255),
	style		nvarchar(16383)
);

insert into themes(name, style) values('Light', 'background: #ccc;');
insert into themes(name, style) values('Dark', 'background: black;');
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
