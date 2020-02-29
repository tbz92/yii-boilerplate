/*
Navicat MySQL Data Transfer

Source Server         : LocalHost
Source Server Version : 100138
Source Host           : localhost:3306
Source Database       : yii-boilerplate

Target Server Type    : MYSQL
Target Server Version : 100138
File Encoding         : 65001

Date: 2020-03-01 00:06:07
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for tbl_migration
-- ----------------------------
DROP TABLE IF EXISTS `tbl_migration`;
CREATE TABLE `tbl_migration` (
  `version` varchar(180) NOT NULL,
  `apply_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of tbl_migration
-- ----------------------------
INSERT INTO `tbl_migration` VALUES ('m000000_000000_base', '1582836036');
INSERT INTO `tbl_migration` VALUES ('m200227_201654_createUserTable', '1582970529');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `marks` text,
  `status` tinyint(1) DEFAULT '1',
  `created_by` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(100) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('1', 'Daniel', 'Khan', 'daniel@khan.com', '45', '1', 'Daniel Khan', '2020-03-01 00:04:10', '', '0000-00-00 00:00:00');
