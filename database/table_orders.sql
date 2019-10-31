DROP TABLE IF EXISTS `store`.`orders`;

CREATE TABLE `store`.`orders` (
`id` VARCHAR(357) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,
`account` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,
`product_id` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,
`qty` INT(2) NOT NULL ,
PRIMARY KEY (`id`)
) ENGINE = InnoDB;
LOAD DATA INFILE '/rawdata_orders.csv' 
INTO TABLE `store`.`orders`
CHARACTER SET utf8mb4 # This line is very important! Without this line, chinese characters can not be displayed normally. 
FIELDS TERMINATED BY ',' 
OPTIONALLY ENCLOSED BY '\''
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
