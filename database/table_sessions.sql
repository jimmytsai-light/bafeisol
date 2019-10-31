DROP TABLE IF EXISTS `store`.`sessions`;

CREATE TABLE `store`.`sessions` (
`sid` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,
`account` VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL ,
PRIMARY KEY (`sid`)
) ENGINE = InnoDB;
