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

drop table if exists data;
create table data (
	id			 serial,
	user		 bigint,
	name		 nvarchar(1023),
	data		 longtext
);

drop table if exists dashboards;
create table dashboards (
	id			serial,
	user		bigint,
	name		nvarchar(1023),
	layout		bigint,
	data		bigint
);

drop table if exists charts;
create table charts (
	id			serial,
	dashboard	bigint,
	number		int,
	name		nvarchar(1023),
	type		varchar(255),	-- bar, line, pie
	options		longtext,		-- json format
	dimension	longtext,		-- code e.g. dc.pluck('column')
	reduce		longtext		-- code e.g. reduceSum(dc.pluck('column'))
);

drop table if exists layouts;
create table layouts (
	id				serial,
	name			nvarchar(1023),
	icon			nvarchar(1023),
	file			nvarchar(1023)
);














/*
NOTE:








*/
