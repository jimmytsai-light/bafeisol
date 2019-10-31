DROP DATABASE IF EXISTS `store`;

CREATE DATABASE `store` DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

SOURCE table_contacts.sql;
SOURCE table_orders.sql;
SOURCE table_products.sql;
SOURCE table_sessions.sql;
SOURCE table_users.sql;