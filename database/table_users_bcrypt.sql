DROP TABLE IF EXISTS `store`.`users`;

CREATE TABLE `store`.`users` (
`account` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,
`hash` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,
PRIMARY KEY (`account`)
) ENGINE = InnoDB;
LOAD DATA INFILE '/rawdata_users_bcrypt.csv' 
INTO TABLE `store`.`users`
CHARACTER SET utf8mb4 # This line is very important! Without this line, chinese characters can not be displayed normally. 
FIELDS TERMINATED BY ',' 
OPTIONALLY ENCLOSED BY '\''
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;