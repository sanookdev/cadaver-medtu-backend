/*
SQLyog Community v13.1.9 (64 bit)
MySQL - 5.7.44 : Database - db_cadaver
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`db_cadaver` /*!40100 DEFAULT CHARACTER SET utf8 */;

USE `db_cadaver`;

/*Table structure for table `tb_bodyparts` */

DROP TABLE IF EXISTS `tb_bodyparts`;

CREATE TABLE `tb_bodyparts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name_th` varchar(255) NOT NULL,
  `name_en` varchar(255) NOT NULL,
  `price` float NOT NULL,
  `quantity` int(11) NOT NULL,
  `about` mediumtext,
  `created_by` varchar(45) NOT NULL DEFAULT 'system',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(45) DEFAULT NULL,
  `updated_date` datetime DEFAULT NULL,
  `imageUrl` mediumtext,
  `status` enum('public','unpublic') DEFAULT 'public',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

/*Table structure for table `tb_booked_part` */

DROP TABLE IF EXISTS `tb_booked_part`;

CREATE TABLE `tb_booked_part` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `bodypart_id` int(11) NOT NULL,
  `body_part_amount` int(11) NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_request` varchar(50) NOT NULL DEFAULT 'system',
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8;

/*Table structure for table `tb_events_logs` */

DROP TABLE IF EXISTS `tb_events_logs`;

CREATE TABLE `tb_events_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_name` varchar(255) NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(50) NOT NULL DEFAULT 'system',
  `comment` mediumtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

/*Table structure for table `tb_logs` */

DROP TABLE IF EXISTS `tb_logs`;

CREATE TABLE `tb_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target_id` int(11) NOT NULL DEFAULT '0' COMMENT '0 = Login & Logout',
  `event_id` int(11) NOT NULL,
  `action_by` varchar(255) NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `tb_projects` */

DROP TABLE IF EXISTS `tb_projects`;

CREATE TABLE `tb_projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_name` varchar(255) NOT NULL,
  `project_start_date` date NOT NULL,
  `project_number_of_participants` int(11) NOT NULL,
  `project_coordinator` varchar(255) NOT NULL,
  `project_coordinator_mobile` varchar(11) NOT NULL,
  `created_by` varchar(255) NOT NULL DEFAULT 'system',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;

/*Table structure for table `tb_site_informations` */

DROP TABLE IF EXISTS `tb_site_informations`;

CREATE TABLE `tb_site_informations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_name_th` mediumtext NOT NULL,
  `descriptions` mediumtext,
  `updated_by` varchar(255) NOT NULL DEFAULT 'system',
  `updated_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Table structure for table `tb_users` */

DROP TABLE IF EXISTS `tb_users`;

CREATE TABLE `tb_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` mediumtext NOT NULL,
  `created_by` varchar(50) NOT NULL DEFAULT 'admin',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role` enum('admin','user','moderator') DEFAULT 'user',
  `imageUrl` mediumtext,
  `status` enum('active','inactive') DEFAULT 'inactive',
  `updatedAt` datetime DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` bigint(20) DEFAULT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `verification_expires` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;

/*Table structure for table `tb_zone` */

DROP TABLE IF EXISTS `tb_zone`;

CREATE TABLE `tb_zone` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(255) DEFAULT 'system',
  `remark` mediumtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
