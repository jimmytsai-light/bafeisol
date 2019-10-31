DROP TABLE IF EXISTS `store`.`products`;

CREATE TABLE `store`.`products` ( 
`src` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,  
`title` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,  
`price` INT(9) UNSIGNED NOT NULL ,  
`id` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,  
`description` VARCHAR(10000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL ,    
PRIMARY KEY  (`id`)) 
ENGINE = InnoDB;
LOAD DATA INFILE '/rawdata_products.csv' 
INTO TABLE `store`.`products`
CHARACTER SET utf8mb4 # This line is very important! Without this line, chinese characters can not be displayed normally. 
FIELDS TERMINATED BY ',' 
OPTIONALLY ENCLOSED BY '\''
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;