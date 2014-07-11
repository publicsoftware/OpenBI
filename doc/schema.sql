-- create database openbi default charset=utf8;
-- create user 'openbi'@'localhost' identified by 'p@ssword';
-- grant all on openbi.* to 'openbi'@'localhost';

use openbi;

drop table if exists users;
create table users (
  id          serial,
  user        nvarchar(255),
  email       nvarchar(255),
  password     varchar(2047),
  name        nvarchar(255),
  role        nvarchar(255)
);

insert into users(user, email, name, role, password)
  values('root', 'email@email.com', 'System Administrator', 'root',
         sha2('password', 256));



create table data (
  id       serial,
  user     bigint,
  data     longtext
)
