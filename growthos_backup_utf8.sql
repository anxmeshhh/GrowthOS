-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: growthos
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add learning path',7,'add_learningpath'),(26,'Can change learning path',7,'change_learningpath'),(27,'Can delete learning path',7,'delete_learningpath'),(28,'Can view learning path',7,'view_learningpath'),(29,'Can add topic',8,'add_topic'),(30,'Can change topic',8,'change_topic'),(31,'Can delete topic',8,'delete_topic'),(32,'Can view topic',8,'view_topic'),(33,'Can add user profile',9,'add_userprofile'),(34,'Can change user profile',9,'change_userprofile'),(35,'Can delete user profile',9,'delete_userprofile'),(36,'Can view user profile',9,'view_userprofile'),(37,'Can add topic progress',10,'add_topicprogress'),(38,'Can change topic progress',10,'change_topicprogress'),(39,'Can delete topic progress',10,'delete_topicprogress'),(40,'Can view topic progress',10,'view_topicprogress'),(41,'Can add contribution',11,'add_contribution'),(42,'Can change contribution',11,'change_contribution'),(43,'Can delete contribution',11,'delete_contribution'),(44,'Can view contribution',11,'view_contribution'),(45,'Can add topic material',12,'add_topicmaterial'),(46,'Can change topic material',12,'change_topicmaterial'),(47,'Can delete topic material',12,'delete_topicmaterial'),(48,'Can view topic material',12,'view_topicmaterial'),(49,'Can add bookmark',13,'add_bookmark'),(50,'Can change bookmark',13,'change_bookmark'),(51,'Can delete bookmark',13,'delete_bookmark'),(52,'Can view bookmark',13,'view_bookmark'),(53,'Can add topic note',14,'add_topicnote'),(54,'Can change topic note',14,'change_topicnote'),(55,'Can delete topic note',14,'delete_topicnote'),(56,'Can view topic note',14,'view_topicnote'),(57,'Can add note document',15,'add_notedocument'),(58,'Can change note document',15,'change_notedocument'),(59,'Can delete note document',15,'delete_notedocument'),(60,'Can view note document',15,'view_notedocument'),(61,'Can add chat message',16,'add_chatmessage'),(62,'Can change chat message',16,'change_chatmessage'),(63,'Can delete chat message',16,'delete_chatmessage'),(64,'Can view chat message',16,'view_chatmessage'),(65,'Can add topic quiz',17,'add_topicquiz'),(66,'Can change topic quiz',17,'change_topicquiz'),(67,'Can delete topic quiz',17,'delete_topicquiz'),(68,'Can view topic quiz',17,'view_topicquiz'),(69,'Can add topic flashcard',18,'add_topicflashcard'),(70,'Can change topic flashcard',18,'change_topicflashcard'),(71,'Can delete topic flashcard',18,'delete_topicflashcard'),(72,'Can view topic flashcard',18,'view_topicflashcard'),(73,'Can add verified project',19,'add_verifiedproject'),(74,'Can change verified project',19,'change_verifiedproject'),(75,'Can delete verified project',19,'delete_verifiedproject'),(76,'Can view verified project',19,'view_verifiedproject'),(77,'Can add path sharing',20,'add_pathsharing'),(78,'Can change path sharing',20,'change_pathsharing'),(79,'Can delete path sharing',20,'delete_pathsharing'),(80,'Can view path sharing',20,'view_pathsharing'),(81,'Can add topic screenshot',21,'add_topicscreenshot'),(82,'Can change topic screenshot',21,'change_topicscreenshot'),(83,'Can delete topic screenshot',21,'delete_topicscreenshot'),(84,'Can view topic screenshot',21,'view_topicscreenshot'),(85,'Can add otp verification',22,'add_otpverification'),(86,'Can change otp verification',22,'change_otpverification'),(87,'Can delete otp verification',22,'delete_otpverification'),(88,'Can view otp verification',22,'view_otpverification'),(89,'Can add admin request',23,'add_adminrequest'),(90,'Can change admin request',23,'change_adminrequest'),(91,'Can delete admin request',23,'delete_adminrequest'),(92,'Can view admin request',23,'view_adminrequest'),(93,'Can add topic feynman',24,'add_topicfeynman'),(94,'Can change topic feynman',24,'change_topicfeynman'),(95,'Can delete topic feynman',24,'delete_topicfeynman'),(96,'Can view topic feynman',24,'view_topicfeynman');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'pbkdf2_sha256$600000$W2CCN6wf7bepMxK6mWwxMy$d/aeURYSuOFb/lDqM2BTG+k0J8P8r1z+h+vay2+K7S0=','2026-06-16 02:17:04.481244',1,'animesh','','','animesh@growthos.com',1,1,'2026-06-13 10:10:13.501994'),(2,'pbkdf2_sha256$600000$cbx3w4vj6XKFFsEmBJGI0e$kZI9h1dU9KhZLTyKX4tk6L57BP5EgUZM0dYMRBZNsbo=',NULL,0,'animeshbro4','','','animeshbro4@gmail.com',0,1,'2026-06-13 10:32:01.790548'),(3,'pbkdf2_sha256$600000$H6H3HZVXd1xFKh7E8qalqK$ooXUz38Az7CusiIguYB4QqX2dS7eWYCCAcurHNyu6ZI=',NULL,0,'animeshbro4@gmail.com','','','animeshbro4@gmail.com',0,1,'2026-06-13 16:51:04.437623'),(4,'!9WUBbjHt5Y578zKXpEc8KH3NsE09DQU1368RpQS6',NULL,0,'animeshsarkaar14@gmail.com','Animesh','sarkaar','animeshsarkaar14@gmail.com',0,0,'2026-06-18 12:54:28.911982'),(5,'!j2jl6VH9yGedxwWy4KbZzUqR7PsncwrDfvAtfVoa',NULL,0,'theanimeshgupta@gmail.com','07.Animesh','Gupta','theanimeshgupta@gmail.com',0,0,'2026-06-18 13:00:36.017760'),(6,'pbkdf2_sha256$600000$sHIiF4Otj2DrMp1pDK4KdA$iWxWrF+lfIQ7POZVMlEuLiRWT5v02TlDU60k73Qjg/w=','2026-06-20 19:13:53.497117',1,'anxmeshhh','','','anxmeshhh@admin.com',1,1,'2026-06-20 16:43:36.964360'),(7,'pbkdf2_sha256$600000$JcziE9O0O6tEkUUL4ca24v$0L/rSZbTpaSDNfcUYE6Yh81oQ2/Yk62FaIGzFpV2zf4=',NULL,1,'theanimesh2005','','','guptaanimesh020@gmail.com',1,1,'2026-06-20 16:43:37.199449');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_adminrequest`
--

DROP TABLE IF EXISTS `core_adminrequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_adminrequest` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_adminrequest_user_id_121ccaec_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_adminrequest_user_id_121ccaec_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_adminrequest`
--

LOCK TABLES `core_adminrequest` WRITE;
/*!40000 ALTER TABLE `core_adminrequest` DISABLE KEYS */;
INSERT INTO `core_adminrequest` VALUES (1,'pending','2026-06-20 16:42:08.371467','2026-06-20 16:42:08.371467',3);
/*!40000 ALTER TABLE `core_adminrequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_bookmark`
--

DROP TABLE IF EXISTS `core_bookmark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_bookmark` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `path_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_bookmark_user_id_path_id_24b69923_uniq` (`user_id`,`path_id`),
  KEY `core_bookmark_path_id_a44ea425_fk_core_learningpath_id` (`path_id`),
  CONSTRAINT `core_bookmark_path_id_a44ea425_fk_core_learningpath_id` FOREIGN KEY (`path_id`) REFERENCES `core_learningpath` (`id`),
  CONSTRAINT `core_bookmark_user_id_3cf59058_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_bookmark`
--

LOCK TABLES `core_bookmark` WRITE;
/*!40000 ALTER TABLE `core_bookmark` DISABLE KEYS */;
INSERT INTO `core_bookmark` VALUES (6,'2026-06-16 01:13:40.096574',4,3),(7,'2026-06-17 15:47:46.287068',3,3),(10,'2026-06-18 15:58:00.907810',5,3),(12,'2026-06-18 17:45:51.588023',1,3);
/*!40000 ALTER TABLE `core_bookmark` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_chatmessage`
--

DROP TABLE IF EXISTS `core_chatmessage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_chatmessage` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_chatmessage_user_id_0f2e7cbf_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_chatmessage_user_id_0f2e7cbf_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_chatmessage`
--

LOCK TABLES `core_chatmessage` WRITE;
/*!40000 ALTER TABLE `core_chatmessage` DISABLE KEYS */;
INSERT INTO `core_chatmessage` VALUES (9,'user','What are my current stats and level?','2026-06-21 16:21:49.092535',3),(10,'ai','**Your Current Stats:**\n\n- Level: 6\n- Total XP: 318\n\nYou\'re making progress, \'animeshbro4\'! Time to push forward. What\'s your next question or challenge?','2026-06-21 16:21:49.577297',3);
/*!40000 ALTER TABLE `core_chatmessage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_contribution`
--

DROP TABLE IF EXISTS `core_contribution`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_contribution` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_contribution_user_id_98981533_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_contribution_user_id_98981533_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_contribution`
--

LOCK TABLES `core_contribution` WRITE;
/*!40000 ALTER TABLE `core_contribution` DISABLE KEYS */;
INSERT INTO `core_contribution` VALUES (1,'daily_login',5,2,'2026-06-13 11:55:21.986103'),(2,'notes_uploaded',1,2,'2026-06-13 12:05:11.826572'),(3,'signup_bonus',50,3,'2026-06-13 16:51:04.782890'),(4,'daily_login',5,3,'2026-06-13 16:51:06.873787'),(5,'daily_login',5,3,'2026-06-14 22:02:53.881174'),(6,'daily_login',5,3,'2026-06-15 09:48:59.123813'),(7,'daily_login',5,3,'2026-06-16 00:07:42.392116'),(8,'notes_uploaded',1,3,'2026-06-16 00:20:49.957152'),(9,'path_bookmarked',3,3,'2026-06-16 01:05:27.566805'),(10,'path_bookmarked',3,3,'2026-06-16 01:10:23.724736'),(11,'path_bookmarked',3,3,'2026-06-16 01:10:26.287117'),(12,'path_cloned',5,3,'2026-06-16 01:14:06.396177'),(13,'custom_path_created',10,3,'2026-06-16 01:46:31.773903'),(14,'custom_path_created',10,1,'2026-06-16 02:17:18.475440'),(15,'daily_login',5,3,'2026-06-17 11:37:11.325784'),(16,'custom_path_created',10,3,'2026-06-17 11:42:48.134221'),(17,'notes_uploaded',1,3,'2026-06-17 15:28:45.325157'),(18,'path_bookmarked',1,3,'2026-06-17 16:22:00.412698'),(19,'daily_login',1,3,'2026-06-18 11:35:24.608765'),(20,'active_engagement',1,3,'2026-06-18 11:41:34.392336'),(21,'general_activity',1,3,'2026-06-18 11:42:46.292265'),(22,'general_activity',1,3,'2026-06-18 11:43:50.718187'),(23,'task_completed',1,3,'2026-06-18 11:44:24.153673'),(24,'task_completed',1,3,'2026-06-18 11:44:25.517967'),(25,'general_activity',1,3,'2026-06-18 11:50:55.076379'),(26,'general_activity',1,3,'2026-06-18 11:58:45.129120'),(27,'general_activity',1,3,'2026-06-18 12:05:34.343620'),(28,'general_activity',1,3,'2026-06-18 12:07:03.177346'),(29,'general_activity',1,3,'2026-06-18 12:08:03.696508'),(30,'general_activity',1,3,'2026-06-18 12:09:03.852248'),(31,'general_activity',1,3,'2026-06-18 12:10:37.693657'),(32,'general_activity',1,3,'2026-06-18 12:14:15.739152'),(33,'general_activity',1,3,'2026-06-18 12:15:38.430513'),(34,'general_activity',1,3,'2026-06-18 12:19:17.444201'),(35,'signup_bonus',1,4,'2026-06-18 12:54:28.942538'),(36,'daily_login',1,4,'2026-06-18 12:54:30.715181'),(37,'signup_bonus',1,5,'2026-06-18 13:00:36.031736'),(38,'daily_login',1,5,'2026-06-18 13:00:37.491846'),(39,'task_completed',1,5,'2026-06-18 13:00:56.937356'),(40,'task_completed',1,5,'2026-06-18 14:07:59.296397'),(41,'notes_uploaded',1,5,'2026-06-18 14:09:25.875532'),(42,'task_completed',1,5,'2026-06-18 14:09:26.395300'),(43,'task_completed',1,5,'2026-06-18 14:09:28.266251'),(44,'task_completed',1,5,'2026-06-18 14:09:33.526204'),(45,'task_completed',1,5,'2026-06-18 14:10:20.285605'),(46,'task_completed',1,5,'2026-06-18 14:11:19.564953'),(47,'github_commit',5,3,'2026-06-18 14:38:17.265519'),(48,'task_completed',1,3,'2026-06-18 14:38:17.814964'),(49,'notes_uploaded',1,3,'2026-06-18 14:45:09.592793'),(50,'task_completed',1,3,'2026-06-18 14:45:10.125850'),(51,'task_completed',1,3,'2026-06-18 14:45:19.316210'),(52,'task_completed',1,3,'2026-06-18 14:48:10.321631'),(53,'task_completed',1,3,'2026-06-18 14:48:12.302942'),(54,'task_completed',1,3,'2026-06-18 14:50:10.421852'),(55,'task_completed',1,3,'2026-06-18 14:50:24.347725'),(56,'task_completed',1,3,'2026-06-18 14:50:27.393468'),(57,'task_completed',1,3,'2026-06-18 14:50:50.004848'),(58,'task_completed',1,3,'2026-06-18 14:53:07.923507'),(59,'task_completed',1,3,'2026-06-18 14:53:25.531373'),(60,'task_completed',1,3,'2026-06-18 14:53:28.733093'),(61,'task_completed',1,3,'2026-06-18 14:54:28.944401'),(62,'github_commit',5,3,'2026-06-18 14:54:55.445054'),(63,'task_completed',1,3,'2026-06-18 14:54:56.281949'),(64,'task_completed',1,3,'2026-06-18 14:55:54.321682'),(65,'task_completed',1,3,'2026-06-18 14:56:00.015397'),(66,'task_completed',1,3,'2026-06-18 14:57:06.407069'),(67,'task_completed',1,3,'2026-06-18 15:00:40.411058'),(68,'task_completed',1,3,'2026-06-18 15:21:21.016426'),(69,'task_completed',1,3,'2026-06-18 15:21:21.981835'),(70,'github_commit',5,3,'2026-06-18 15:21:54.565130'),(71,'task_completed',1,3,'2026-06-18 15:21:55.289054'),(72,'task_completed',1,3,'2026-06-18 15:22:06.635875'),(73,'path_generated',2,3,'2026-06-18 15:26:27.352152'),(74,'task_completed',1,3,'2026-06-18 15:26:27.889055'),(75,'custom_path_created',1,3,'2026-06-18 15:26:33.570735'),(76,'task_completed',1,3,'2026-06-18 15:26:34.257203'),(77,'path_bookmarked',1,3,'2026-06-18 15:26:40.092590'),(78,'task_completed',1,3,'2026-06-18 15:26:40.619732'),(79,'task_completed',1,3,'2026-06-18 15:26:54.978707'),(80,'task_completed',1,3,'2026-06-18 15:27:00.339440'),(81,'path_generated',2,1,'2026-06-18 15:27:25.630940'),(82,'task_completed',1,3,'2026-06-18 15:30:12.813759'),(83,'path_bookmarked',1,3,'2026-06-18 15:58:00.929311'),(84,'task_completed',1,3,'2026-06-18 15:58:01.465488'),(85,'path_generated',2,3,'2026-06-18 15:58:38.632634'),(86,'task_completed',1,3,'2026-06-18 15:58:39.187274'),(87,'task_completed',1,3,'2026-06-18 15:59:20.134528'),(88,'task_completed',1,3,'2026-06-18 15:59:48.723960'),(89,'github_commit',5,3,'2026-06-18 16:00:12.888184'),(90,'task_completed',1,3,'2026-06-18 16:00:14.302619'),(91,'task_completed',1,3,'2026-06-18 16:01:02.642253'),(92,'task_completed',1,3,'2026-06-18 16:01:19.457869'),(93,'path_generated',2,3,'2026-06-18 16:07:16.415170'),(94,'task_completed',1,3,'2026-06-18 16:07:16.988469'),(95,'custom_path_created',1,3,'2026-06-18 16:07:19.295752'),(96,'task_completed',1,3,'2026-06-18 16:07:19.968708'),(97,'path_bookmarked',1,3,'2026-06-18 16:07:32.145221'),(98,'task_completed',1,3,'2026-06-18 16:07:32.692752'),(99,'screenshot_uploaded',1,3,'2026-06-18 16:07:54.763904'),(100,'screenshot_uploaded',1,3,'2026-06-18 16:07:55.075776'),(101,'screenshot_uploaded',1,3,'2026-06-18 16:07:55.301055'),(102,'task_completed',1,3,'2026-06-18 16:07:55.319005'),(103,'task_completed',1,3,'2026-06-18 16:07:55.330420'),(104,'task_completed',1,3,'2026-06-18 16:07:55.355224'),(105,'screenshot_uploaded',1,3,'2026-06-18 16:07:55.451485'),(106,'task_completed',1,3,'2026-06-18 16:07:55.612762'),(107,'screenshot_uploaded',1,3,'2026-06-18 16:07:55.620506'),(108,'task_completed',1,3,'2026-06-18 16:07:55.651240'),(109,'task_completed',1,3,'2026-06-18 16:07:55.656112'),(110,'task_completed',1,3,'2026-06-18 16:07:55.849039'),(111,'task_completed',1,3,'2026-06-18 16:07:55.901015'),(112,'task_completed',1,3,'2026-06-18 16:07:55.904542'),(113,'task_completed',1,3,'2026-06-18 16:07:55.978579'),(114,'task_completed',1,3,'2026-06-18 16:07:56.014886'),(115,'task_completed',1,3,'2026-06-18 16:07:56.018710'),(116,'task_completed',1,3,'2026-06-18 16:07:56.149064'),(117,'task_completed',1,3,'2026-06-18 16:07:56.190894'),(118,'task_completed',1,3,'2026-06-18 16:07:56.197860'),(119,'task_completed',1,3,'2026-06-18 16:07:58.188059'),(120,'task_completed',1,3,'2026-06-18 16:08:07.652483'),(121,'task_completed',1,3,'2026-06-18 16:08:07.762512'),(122,'flashcards_generated',1,3,'2026-06-18 16:08:19.705261'),(123,'task_completed',1,3,'2026-06-18 16:08:20.246495'),(124,'task_completed',1,3,'2026-06-18 16:08:47.584652'),(125,'task_completed',1,3,'2026-06-18 16:09:08.569316'),(126,'screenshot_uploaded',1,3,'2026-06-18 16:14:49.566987'),(127,'screenshot_uploaded',1,3,'2026-06-18 16:14:49.876637'),(128,'task_completed',1,3,'2026-06-18 16:14:50.107990'),(129,'screenshot_uploaded',1,3,'2026-06-18 16:14:50.230996'),(130,'task_completed',1,3,'2026-06-18 16:14:50.418431'),(131,'task_completed',1,3,'2026-06-18 16:14:50.779480'),(132,'task_completed',1,3,'2026-06-18 16:15:23.764972'),(133,'task_completed',1,3,'2026-06-18 16:15:25.793137'),(134,'task_completed',1,3,'2026-06-18 16:27:22.296691'),(135,'task_completed',1,3,'2026-06-18 16:27:36.313687'),(136,'task_completed',1,3,'2026-06-18 16:31:32.251763'),(137,'task_completed',1,3,'2026-06-18 16:31:32.617075'),(138,'document_uploaded',1,3,'2026-06-18 16:31:38.361578'),(139,'task_completed',1,3,'2026-06-18 16:31:38.905335'),(140,'task_completed',1,3,'2026-06-18 16:31:38.922745'),(141,'task_completed',1,3,'2026-06-18 16:31:40.927905'),(142,'task_completed',1,3,'2026-06-18 16:39:30.890330'),(143,'task_completed',1,3,'2026-06-18 16:39:36.432690'),(144,'task_completed',1,3,'2026-06-18 16:39:47.309358'),(145,'task_completed',1,3,'2026-06-18 16:41:39.311908'),(146,'task_completed',1,3,'2026-06-18 16:41:40.285494'),(147,'task_completed',1,3,'2026-06-18 16:42:40.528105'),(148,'task_completed',1,3,'2026-06-18 16:43:10.299028'),(149,'task_completed',1,3,'2026-06-18 16:43:15.306176'),(150,'task_completed',1,3,'2026-06-18 16:45:59.306977'),(151,'task_completed',1,3,'2026-06-18 16:47:02.209550'),(152,'task_completed',1,3,'2026-06-18 16:48:24.685241'),(153,'task_completed',1,3,'2026-06-18 17:45:20.318039'),(154,'task_completed',1,3,'2026-06-18 17:45:21.959054'),(155,'task_completed',1,3,'2026-06-18 17:45:49.821564'),(156,'task_completed',1,3,'2026-06-18 17:45:52.144562'),(157,'task_completed',1,3,'2026-06-18 17:46:54.226585'),(158,'screenshot_uploaded',1,3,'2026-06-18 17:47:23.344000'),(159,'screenshot_uploaded',1,3,'2026-06-18 17:47:23.806610'),(160,'task_completed',1,3,'2026-06-18 17:47:23.900737'),(161,'screenshot_uploaded',1,3,'2026-06-18 17:47:24.092363'),(162,'screenshot_uploaded',1,3,'2026-06-18 17:47:24.254269'),(163,'task_completed',1,3,'2026-06-18 17:47:24.337613'),(164,'screenshot_uploaded',1,3,'2026-06-18 17:47:24.399070'),(165,'screenshot_uploaded',1,3,'2026-06-18 17:47:24.533377'),(166,'task_completed',1,3,'2026-06-18 17:47:24.633467'),(167,'screenshot_uploaded',1,3,'2026-06-18 17:47:24.659076'),(168,'task_completed',1,3,'2026-06-18 17:47:24.830846'),(169,'screenshot_uploaded',1,3,'2026-06-18 17:47:24.830846'),(170,'screenshot_uploaded',1,3,'2026-06-18 17:47:24.926481'),(171,'task_completed',1,3,'2026-06-18 17:47:24.952723'),(172,'screenshot_uploaded',1,3,'2026-06-18 17:47:25.042301'),(173,'task_completed',1,3,'2026-06-18 17:47:25.069336'),(174,'screenshot_uploaded',1,3,'2026-06-18 17:47:25.111459'),(175,'task_completed',1,3,'2026-06-18 17:47:25.203668'),(176,'task_completed',1,3,'2026-06-18 17:47:25.378977'),(177,'task_completed',1,3,'2026-06-18 17:47:25.460686'),(178,'task_completed',1,3,'2026-06-18 17:47:25.576260'),(179,'task_completed',1,3,'2026-06-18 17:47:25.668601'),(180,'task_completed',1,3,'2026-06-18 17:47:37.261631'),(181,'task_completed',1,3,'2026-06-18 17:47:42.733099'),(182,'task_completed',1,3,'2026-06-18 17:47:44.761809'),(183,'document_uploaded',1,3,'2026-06-18 17:47:53.832792'),(184,'task_completed',1,3,'2026-06-18 17:47:54.371710'),(185,'flashcards_generated',1,3,'2026-06-18 17:48:46.504170'),(186,'task_completed',1,3,'2026-06-18 17:48:47.053099'),(187,'task_completed',1,3,'2026-06-18 17:48:55.248652'),(188,'task_completed',1,3,'2026-06-18 17:48:57.222311'),(189,'task_completed',1,3,'2026-06-18 17:50:27.576810'),(190,'path_generated',2,3,'2026-06-18 17:52:29.076714'),(191,'task_completed',1,3,'2026-06-18 17:52:29.636534'),(192,'custom_path_created',1,3,'2026-06-18 17:52:34.306771'),(193,'task_completed',1,3,'2026-06-18 17:52:34.945745'),(194,'task_completed',1,3,'2026-06-18 17:55:22.495463'),(195,'task_completed',1,3,'2026-06-18 17:56:20.340851'),(196,'task_completed',1,3,'2026-06-18 17:56:21.082718'),(197,'task_completed',1,3,'2026-06-18 17:59:59.670350'),(198,'daily_login',1,3,'2026-06-20 15:17:14.757561'),(199,'daily_login',1,6,'2026-06-20 16:44:43.401970'),(200,'notes_uploaded',1,3,'2026-06-20 17:30:11.976064'),(201,'daily_login',1,3,'2026-06-21 13:17:22.214001'),(202,'notes_uploaded',1,3,'2026-06-21 13:21:55.824839'),(203,'flashcards_generated',1,3,'2026-06-21 14:16:24.871528'),(204,'flashcards_generated',1,3,'2026-06-21 14:16:28.137831'),(205,'flashcards_generated',1,3,'2026-06-21 14:16:29.942833'),(206,'flashcards_generated',1,3,'2026-06-21 14:16:31.228609'),(207,'flashcards_generated',1,3,'2026-06-21 14:16:33.273204'),(208,'flashcards_generated',1,3,'2026-06-21 14:16:34.904728'),(209,'flashcards_generated',1,3,'2026-06-21 14:17:44.128709'),(210,'flashcards_generated',1,3,'2026-06-21 14:20:38.969413'),(211,'path_generated',2,3,'2026-06-21 15:38:33.382620'),(212,'path_generated',2,3,'2026-06-21 15:38:39.785214'),(213,'custom_path_created',1,3,'2026-06-21 15:38:42.585561'),(214,'path_generated',2,3,'2026-06-21 15:40:12.507432'),(215,'custom_path_created',1,3,'2026-06-21 15:40:15.684143');
/*!40000 ALTER TABLE `core_contribution` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_learningpath`
--

DROP TABLE IF EXISTS `core_learningpath`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_learningpath` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_by_id` int DEFAULT NULL,
  `is_custom` tinyint(1) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `estimated_weeks` int DEFAULT NULL,
  `original_path_id` bigint DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `visibility` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `github_repo_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `core_learningpath_created_by_id_e7c828fd_fk_auth_user_id` (`created_by_id`),
  KEY `core_learningpath_original_path_id_3845ceb0_fk_core_lear` (`original_path_id`),
  CONSTRAINT `core_learningpath_created_by_id_e7c828fd_fk_auth_user_id` FOREIGN KEY (`created_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `core_learningpath_original_path_id_3845ceb0_fk_core_lear` FOREIGN KEY (`original_path_id`) REFERENCES `core_learningpath` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_learningpath`
--

LOCK TABLES `core_learningpath` WRITE;
/*!40000 ALTER TABLE `core_learningpath` DISABLE KEYS */;
INSERT INTO `core_learningpath` VALUES (1,'Backend Developer','backend','Master server-side development with databases, APIs, caching, and deployment.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-18 14:38:01.770437','private','growthos-backend'),(2,'Frontend Developer','frontend','Build modern web interfaces with HTML, CSS, JavaScript, and popular frameworks.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-15 09:49:55.173896','private',NULL),(3,'AI Engineer','ai-engineer','Learn to build AI-powered applications using LLMs, RAG, embeddings, and agents.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-15 09:49:55.173896','private',NULL),(4,'API Design','api-design','Design and build robust, secure, and performant APIs from scratch.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-15 09:49:55.173896','private',NULL),(5,'Data Structures & Algorithms','datastructures-and-algorithms','Master DSA fundamentals for coding interviews and problem-solving.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-15 09:49:55.173896','private',NULL),(6,'Django Framework','django','Full-stack Python web development with Django ΓÇö models, views, REST, deployment.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-15 09:49:55.173896','private',NULL),(7,'SQL Mastery','sql','Learn SQL from basics to advanced queries, optimization, and database management.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-15 09:49:55.173896','private',NULL),(8,'System Design','system-design','Learn to design scalable, reliable, and performant distributed systems.',1,1,0,'2026-06-15 09:49:54.938870',12,NULL,'2026-06-15 09:49:55.173896','private',NULL),(26,'Test Path','test-path','',1,1,1,'2026-06-16 02:17:18.460801',12,NULL,'2026-06-16 02:17:18.460801','private',NULL),(37,'Full Stack Mastery','fullstack-mastery','The complete roadmap to becoming an elite Full Stack Web Developer.',1,NULL,0,'2026-06-20 19:18:02.240315',32,NULL,'2026-06-20 19:18:02.240315','public',NULL),(39,'Game Development Mastery','game-development-mastery','',1,3,1,'2026-06-21 15:40:15.588799',8,NULL,'2026-06-21 15:40:15.588799','private',NULL);
/*!40000 ALTER TABLE `core_learningpath` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_notedocument`
--

DROP TABLE IF EXISTS `core_notedocument`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_notedocument` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_notedocument_topic_id_01784da0_fk_core_topic_id` (`topic_id`),
  KEY `core_notedocument_user_id_f6bb5634_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_notedocument_topic_id_01784da0_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_notedocument_user_id_f6bb5634_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_notedocument`
--

LOCK TABLES `core_notedocument` WRITE;
/*!40000 ALTER TABLE `core_notedocument` DISABLE KEYS */;
INSERT INTO `core_notedocument` VALUES (2,'note_documents/bulk_id_cards_front_back.pdf','bulk_id_cards_front_back.pdf','2026-06-18 16:31:38.359091',1710,3),(3,'note_documents/Animesh_Gupta_Offer_Letter._2025.pdf','Animesh Gupta Offer Letter. 2025.pdf','2026-06-18 17:47:53.815831',1713,3);
/*!40000 ALTER TABLE `core_notedocument` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_otpverification`
--

DROP TABLE IF EXISTS `core_otpverification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_otpverification` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_verified` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_otpverification`
--

LOCK TABLES `core_otpverification` WRITE;
/*!40000 ALTER TABLE `core_otpverification` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_otpverification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_pathsharing`
--

DROP TABLE IF EXISTS `core_pathsharing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_pathsharing` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `permission` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `path_id` bigint NOT NULL,
  `shared_by_id` int NOT NULL,
  `shared_to_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_pathsharing_path_id_shared_to_id_06644876_uniq` (`path_id`,`shared_to_id`),
  KEY `core_pathsharing_shared_by_id_9d9fe874_fk_auth_user_id` (`shared_by_id`),
  KEY `core_pathsharing_shared_to_id_ff2c9c10_fk_auth_user_id` (`shared_to_id`),
  CONSTRAINT `core_pathsharing_path_id_f88a1810_fk_core_learningpath_id` FOREIGN KEY (`path_id`) REFERENCES `core_learningpath` (`id`),
  CONSTRAINT `core_pathsharing_shared_by_id_9d9fe874_fk_auth_user_id` FOREIGN KEY (`shared_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `core_pathsharing_shared_to_id_ff2c9c10_fk_auth_user_id` FOREIGN KEY (`shared_to_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_pathsharing`
--

LOCK TABLES `core_pathsharing` WRITE;
/*!40000 ALTER TABLE `core_pathsharing` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_pathsharing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topic`
--

DROP TABLE IF EXISTS `core_topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topic` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int NOT NULL,
  `path_id` bigint NOT NULL,
  `created_by_id` int DEFAULT NULL,
  `node_kind` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_topic_path_id_19fcdaa8_fk_core_learningpath_id` (`path_id`),
  KEY `core_topic_slug_b2ab79fa` (`slug`),
  KEY `core_topic_created_by_id_d72866e4_fk_auth_user_id` (`created_by_id`),
  CONSTRAINT `core_topic_created_by_id_d72866e4_fk_auth_user_id` FOREIGN KEY (`created_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `core_topic_path_id_19fcdaa8_fk_core_learningpath_id` FOREIGN KEY (`path_id`) REFERENCES `core_learningpath` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2748 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topic`
--

LOCK TABLES `core_topic` WRITE;
/*!40000 ALTER TABLE `core_topic` DISABLE KEYS */;
INSERT INTO `core_topic` VALUES (1494,'Section 1','section-1','',0,26,1,'milestone'),(1495,'What is an AI Engineer?','what-is-an-ai-engineer','',0,3,1,'milestone'),(1496,'Roles and Responsibilities','roles-and-responsibilities','',1,3,1,'topic'),(1497,'AI Engineer vs ML Engineer','ai-engineer-vs-ml-engineer','',2,3,1,'topic'),(1498,'Impact on Product Development','impact-on-product-development','',3,3,1,'topic'),(1499,'AI vs AGI','ai-vs-agi','',4,3,1,'topic'),(1500,'Common Terminology','common-terminology','',5,3,1,'milestone'),(1501,'LLMs','llms','',6,3,1,'topic'),(1502,'Inference','inference','',7,3,1,'topic'),(1503,'Training','training','',8,3,1,'topic'),(1504,'Embeddings','embeddings','',9,3,1,'topic'),(1505,'Vector Databases','vector-databases','',10,3,1,'topic'),(1506,'AI Agents','ai-agents','',11,3,1,'topic'),(1507,'RAG','rag','',12,3,1,'topic'),(1508,'Prompt Engineering','prompt-engineering','',13,3,1,'topic'),(1509,'Pre-trained Models','pre-trained-models','',14,3,1,'milestone'),(1510,'Using Pre-trained Models','using-pre-trained-models','',15,3,1,'topic'),(1511,'Benefits of Pre-trained Models','benefits-of-pre-trained-models','',16,3,1,'topic'),(1512,'Limitations and Considerations','limitations-and-considerations','',17,3,1,'topic'),(1513,'Popular AI Models','popular-ai-models','',18,3,1,'milestone'),(1514,'OpenAI Models','openai-models','',19,3,1,'topic'),(1515,'Capabilities / Context Length','capabilities-context-length','',20,3,1,'topic'),(1516,'Cut-off Dates / Knowledge','cut-off-dates-knowledge','',21,3,1,'topic'),(1517,'Anthropic\'s Claude','anthropic-s-claude','',22,3,1,'topic'),(1518,'Google\'s Gemini','google-s-gemini','',23,3,1,'topic'),(1519,'Azure AI','azure-ai','',24,3,1,'topic'),(1520,'AWS Sagemaker','aws-sagemaker','',25,3,1,'topic'),(1521,'Mistral AI','mistral-ai','',26,3,1,'topic'),(1522,'Cohere','cohere','',27,3,1,'topic'),(1523,'Replicate','replicate','',28,3,1,'topic'),(1524,'OpenAI API','openai-api','',29,3,1,'milestone'),(1525,'Chat Completions API','chat-completions-api','',30,3,1,'topic'),(1526,'Open AI Playground','open-ai-playground','',31,3,1,'topic'),(1527,'Fine-tuning','fine-tuning','',32,3,1,'topic'),(1528,'Managing Tokens','managing-tokens','',33,3,1,'milestone'),(1529,'Writing Prompts','writing-prompts','',34,3,1,'topic'),(1530,'Maximum Tokens','maximum-tokens','',35,3,1,'topic'),(1531,'Token Counting','token-counting','',36,3,1,'topic'),(1532,'Pricing Considerations','pricing-considerations','',37,3,1,'topic'),(1533,'Prompt Engineering','prompt-engineering-2','',38,3,1,'milestone'),(1534,'Robust prompt engineering','robust-prompt-engineering','',39,3,1,'topic'),(1535,'ReAct Prompting','react-prompting','',40,3,1,'topic'),(1536,'Prompt Engineering Roadmap','prompt-engineering-roadmap','',41,3,1,'topic'),(1537,'AI Safety and Ethics','ai-safety-and-ethics','',42,3,1,'milestone'),(1538,'Security and Privacy Concerns','security-and-privacy-concerns','',43,3,1,'topic'),(1539,'Bias and Fairness','bias-and-fairness','',44,3,1,'topic'),(1540,'Understanding AI Safety Issues','understanding-ai-safety-issues','',45,3,1,'topic'),(1541,'OpenAI Moderation API','openai-moderation-api','',46,3,1,'topic'),(1542,'Adding end-user IDs in prompts','adding-end-user-ids-in-prompts','',47,3,1,'topic'),(1543,'Prompt Injection Attacks','prompt-injection-attacks','',48,3,1,'topic'),(1544,'Conducting adversarial testing','conducting-adversarial-testing','',49,3,1,'topic'),(1545,'OpenSource AI','opensource-ai','',50,3,1,'milestone'),(1546,'Open vs Closed Source Models','open-vs-closed-source-models','',51,3,1,'topic'),(1547,'Popular Open Source Models','popular-open-source-models','',52,3,1,'topic'),(1548,'Finding Open Source Models','finding-open-source-models','',53,3,1,'topic'),(1549,'Hugging Face','hugging-face','',54,3,1,'milestone'),(1550,'Hugging Face Hub','hugging-face-hub','',55,3,1,'topic'),(1551,'Hugging Face Tasks','hugging-face-tasks','',56,3,1,'topic'),(1552,'Hugging Face Models','hugging-face-models','',57,3,1,'topic'),(1553,'Sentence Transformers','sentence-transformers','',58,3,1,'topic'),(1554,'Models on Hugging Face','models-on-hugging-face','',59,3,1,'topic'),(1555,'Inference SDK','inference-sdk','',60,3,1,'topic'),(1556,'Transformers.js','transformers-js','',61,3,1,'topic'),(1557,'Ollama','ollama','',62,3,1,'milestone'),(1558,'Ollama Models','ollama-models','',63,3,1,'topic'),(1559,'Ollama SDK','ollama-sdk','',64,3,1,'topic'),(1560,'Using Open Source Models','using-open-source-models','',65,3,1,'topic'),(1561,'Embeddings & Vector Databases','embeddings-vector-databases','',66,3,1,'milestone'),(1562,'What are Embeddings','what-are-embeddings','',67,3,1,'topic'),(1563,'Open AI Embedding Models','open-ai-embedding-models','',68,3,1,'topic'),(1564,'Open AI Embeddings API','open-ai-embeddings-api','',69,3,1,'topic'),(1565,'Open-Source Embeddings','open-source-embeddings','',70,3,1,'topic'),(1566,'Pricing Considerations','embeddings-vector-databases-pricing-considerations','',71,3,1,'topic'),(1567,'Use Cases for Embeddings','use-cases-for-embeddings','',72,3,1,'milestone'),(1568,'Semantic Search','semantic-search','',73,3,1,'topic'),(1569,'Data Classification','data-classification','',74,3,1,'topic'),(1570,'Recommendation Systems','recommendation-systems','',75,3,1,'topic'),(1571,'Anomaly Detection','anomaly-detection','',76,3,1,'topic'),(1572,'Vector Databases','vector-databases-2','',77,3,1,'milestone'),(1573,'Purpose and Functionality','purpose-and-functionality','',78,3,1,'topic'),(1574,'Chroma','chroma','',79,3,1,'topic'),(1575,'Pinecone','pinecone','',80,3,1,'topic'),(1576,'Weaviate','weaviate','',81,3,1,'topic'),(1577,'FAISS','faiss','',82,3,1,'topic'),(1578,'LanceDB','lancedb','',83,3,1,'topic'),(1579,'Qdrant','qdrant','',84,3,1,'topic'),(1580,'Supabase','supabase','',85,3,1,'topic'),(1581,'MongoDB Atlas','mongodb-atlas','',86,3,1,'topic'),(1582,'RAG & Implementation','rag-implementation','',87,3,1,'milestone'),(1583,'RAG vs Fine-tuning','rag-vs-fine-tuning','',88,3,1,'topic'),(1584,'Implementing RAG','implementing-rag','',89,3,1,'topic'),(1585,'Chunking','chunking','',90,3,1,'topic'),(1586,'Embedding','embedding','',91,3,1,'topic'),(1587,'Vector Database','vector-database','',92,3,1,'topic'),(1588,'Retrieval Process','retrieval-process','',93,3,1,'topic'),(1589,'Generation','generation','',94,3,1,'topic'),(1590,'Using SDKs Directly','using-sdks-directly','',95,3,1,'topic'),(1591,'Langchain','langchain','',96,3,1,'topic'),(1592,'Llama Index','llama-index','',97,3,1,'topic'),(1593,'Implementing Vector Search','implementing-vector-search','',98,3,1,'topic'),(1594,'Indexing Embeddings','indexing-embeddings','',99,3,1,'topic'),(1595,'Performing Similarity Search','performing-similarity-search','',100,3,1,'topic'),(1596,'RAG Alternative','rag-alternative','',101,3,1,'topic'),(1597,'Open AI Assistant API','open-ai-assistant-api','',102,3,1,'topic'),(1598,'AI Agents','ai-agents-2','',103,3,1,'milestone'),(1599,'Agents Usecases','agents-usecases','',104,3,1,'topic'),(1600,'Know your Customers / Usecases','know-your-customers-usecases','',105,3,1,'topic'),(1601,'Constraining outputs and inputs','constraining-outputs-and-inputs','',106,3,1,'topic'),(1602,'Safety Best Practices','safety-best-practices','',107,3,1,'topic'),(1603,'Building AI Agents','building-ai-agents','',108,3,1,'topic'),(1604,'Manual Implementation','manual-implementation','',109,3,1,'topic'),(1605,'OpenAI Functions / Tools','openai-functions-tools','',110,3,1,'topic'),(1606,'OpenAI Assistant API','openai-assistant-api','',111,3,1,'topic'),(1607,'Development Tools','development-tools','',112,3,1,'milestone'),(1608,'AI Code Editors','ai-code-editors','',113,3,1,'topic'),(1609,'Code Completion Tools','code-completion-tools','',114,3,1,'topic'),(1610,'Multimodal AI','multimodal-ai','',115,3,1,'milestone'),(1611,'Image Understanding','image-understanding','',116,3,1,'topic'),(1612,'Image Generation','image-generation','',117,3,1,'topic'),(1613,'Video Understanding','video-understanding','',118,3,1,'topic'),(1614,'Audio Processing','audio-processing','',119,3,1,'topic'),(1615,'Text-to-Speech','text-to-speech','',120,3,1,'topic'),(1616,'Speech-to-Text','speech-to-text','',121,3,1,'topic'),(1617,'OpenAI Vision API','openai-vision-api','',122,3,1,'topic'),(1618,'DALL-E API','dall-e-api','',123,3,1,'topic'),(1619,'Whisper API','whisper-api','',124,3,1,'topic'),(1620,'Hugging Face Models','multimodal-ai-hugging-face-models','',125,3,1,'topic'),(1621,'LangChain for Multimodal Apps','langchain-for-multimodal-apps','',126,3,1,'topic'),(1622,'LlamaIndex for Multimodal Apps','llamaindex-for-multimodal-apps','',127,3,1,'topic'),(1623,'Implementing Multimodal AI','implementing-multimodal-ai','',128,3,1,'topic'),(1624,'What are APIs','what-are-apis','',0,4,1,'milestone'),(1625,'Building APIs','building-apis','',1,4,1,'topic'),(1626,'HTTP','http','',2,4,1,'milestone'),(1627,'Learn the Basics','learn-the-basics','',3,4,1,'topic'),(1628,'HTTP Versions','http-versions','',4,4,1,'topic'),(1629,'HTTP Methods','http-methods','',5,4,1,'topic'),(1630,'HTTP Status Codes','http-status-codes','',6,4,1,'topic'),(1631,'HTTP Headers','http-headers','',7,4,1,'topic'),(1632,'Cookies','cookies','',8,4,1,'topic'),(1633,'CORS','cors','',9,4,1,'topic'),(1634,'HTTP Caching','http-caching','',10,4,1,'topic'),(1635,'Understand TCP / IP','understand-tcp-ip','',11,4,1,'milestone'),(1636,'Basics of DNS','basics-of-dns','',12,4,1,'topic'),(1637,'Different API Styles','different-api-styles','',13,4,1,'milestone'),(1638,'RESTful APIs','restful-apis','',14,4,1,'topic'),(1639,'Simple JSON APIs','simple-json-apis','',15,4,1,'topic'),(1640,'SOAP APIs','soap-apis','',16,4,1,'topic'),(1641,'GraphQL APIs','graphql-apis','',17,4,1,'topic'),(1642,'gRPC APIs','grpc-apis','',18,4,1,'topic'),(1643,'Building JSON / RESTful APIs','building-json-restful-apis','',19,4,1,'milestone'),(1644,'REST Principles','rest-principles','',20,4,1,'topic'),(1645,'URI Design','uri-design','',21,4,1,'topic'),(1646,'Versioning Strategies','versioning-strategies','',22,4,1,'topic'),(1647,'Handling CRUD Operations','handling-crud-operations','',23,4,1,'topic'),(1648,'URL, Query & Path Parameters','url-query-path-parameters','',24,4,1,'topic'),(1649,'Content Negotiation','content-negotiation','',25,4,1,'topic'),(1650,'API Authentication and Authorization','api-authentication-and-authorization','',26,4,1,'milestone'),(1651,'Basic Auth','basic-auth','',27,4,1,'topic'),(1652,'Token Based Auth','token-based-auth','',28,4,1,'topic'),(1653,'JWT','jwt','',29,4,1,'topic'),(1654,'OAuth 2.0','oauth-2-0','',30,4,1,'topic'),(1655,'Session Based Auth','session-based-auth','',31,4,1,'topic'),(1656,'Authorization Methods','authorization-methods','',32,4,1,'milestone'),(1657,'Role Based Access Control (RBAC)','role-based-access-control-rbac','',33,4,1,'topic'),(1658,'Attribute Based Access Control (ABAC)','attribute-based-access-control-abac','',34,4,1,'topic'),(1659,'API Keys & Management','api-keys-management','',35,4,1,'topic'),(1660,'Pagination','pagination','',36,4,1,'milestone'),(1661,'Rate Limiting','rate-limiting','',37,4,1,'topic'),(1662,'Idempotency','idempotency','',38,4,1,'topic'),(1663,'HATEOAS','hateoas','',39,4,1,'topic'),(1664,'Error Handling','error-handling','',40,4,1,'milestone'),(1665,'RFC 7807 - Problem Details for APIs','rfc-7807-problem-details-for-apis','',41,4,1,'topic'),(1666,'API Security','api-security','',42,4,1,'milestone'),(1667,'Common Vulnerabilities','common-vulnerabilities','',43,4,1,'topic'),(1668,'API Security Best Practices','api-security-best-practices','',44,4,1,'topic'),(1669,'API Documentation Tools','api-documentation-tools','',45,4,1,'milestone'),(1670,'Swagger / Open API','swagger-open-api','',46,4,1,'topic'),(1671,'Readme.com','readme-com','',47,4,1,'topic'),(1672,'Stoplight','stoplight','',48,4,1,'topic'),(1673,'Postman','postman','',49,4,1,'topic'),(1674,'API Testing','api-testing','',50,4,1,'milestone'),(1675,'Unit Testing','unit-testing','',51,4,1,'topic'),(1676,'Integration Testing','integration-testing','',52,4,1,'topic'),(1677,'Functional Testing','functional-testing','',53,4,1,'topic'),(1678,'Load Testing','load-testing','',54,4,1,'topic'),(1679,'Mocking APIs','mocking-apis','',55,4,1,'topic'),(1680,'Contract Testing','contract-testing','',56,4,1,'topic'),(1681,'API Performance','api-performance','',57,4,1,'milestone'),(1682,'Performance Metrics','performance-metrics','',58,4,1,'topic'),(1683,'Caching Strategies','caching-strategies','',59,4,1,'topic'),(1684,'Load Balancing','load-balancing','',60,4,1,'topic'),(1685,'Rate Limiting / Throttling','rate-limiting-throttling','',61,4,1,'topic'),(1686,'Profiling and Monitoring','profiling-and-monitoring','',62,4,1,'topic'),(1687,'Performance Testing','performance-testing','',63,4,1,'topic'),(1688,'Error Handling / Retries','error-handling-retries','',64,4,1,'topic'),(1689,'API Integration Patterns','api-integration-patterns','',65,4,1,'milestone'),(1690,'Synchronous vs Asynchronous APIs','synchronous-vs-asynchronous-apis','',66,4,1,'topic'),(1691,'Event Driven Architecture','event-driven-architecture','',67,4,1,'topic'),(1692,'Webhooks vs Polling','webhooks-vs-polling','',68,4,1,'topic'),(1693,'Batch Processing','batch-processing','',69,4,1,'topic'),(1694,'Messaging Queues','messaging-queues','',70,4,1,'milestone'),(1695,'RabbitMQ','rabbitmq','',71,4,1,'topic'),(1696,'Kafka','kafka','',72,4,1,'topic'),(1697,'API Gateways','api-gateways','',73,4,1,'milestone'),(1698,'Microservices Architecture','microservices-architecture','',74,4,1,'topic'),(1699,'Real-time APIs','real-time-apis','',75,4,1,'milestone'),(1700,'Web Sockets','web-sockets','',76,4,1,'topic'),(1701,'Server Sent Events','server-sent-events','',77,4,1,'topic'),(1702,'API Lifecycle Management','api-lifecycle-management','',78,4,1,'milestone'),(1703,'Standards and Compliance','standards-and-compliance','',79,4,1,'topic'),(1704,'GDPR','gdpr','',80,4,1,'topic'),(1705,'CCPA','ccpa','',81,4,1,'topic'),(1706,'PCI DSS','pci-dss','',82,4,1,'topic'),(1707,'HIPAA','hipaa','',83,4,1,'topic'),(1708,'PII','pii','',84,4,1,'topic'),(1709,'Internet','internet','',0,1,1,'milestone'),(1710,'How does the internet work?','how-internet-works','',1,1,1,'topic'),(1711,'What is HTTP?','what-is-http','',2,1,1,'topic'),(1712,'What is Domain Name?','what-is-domain-name','',3,1,1,'topic'),(1713,'What is hosting?','what-is-hosting','',4,1,1,'topic'),(1714,'DNS and how it works?','dns-and-how-it-works','',5,1,1,'topic'),(1715,'Browsers and how they work?','browsers-and-how-they-work','',6,1,1,'topic'),(1716,'Pick a Language','pick-a-language','',7,1,1,'milestone'),(1717,'JavaScript','javascript','',8,1,1,'topic'),(1718,'Go','go','',9,1,1,'topic'),(1719,'Python','python','',10,1,1,'topic'),(1720,'Ruby','ruby','',11,1,1,'topic'),(1721,'Version Control Systems','version-control-systems','',12,1,1,'milestone'),(1722,'Java','java','',13,1,1,'topic'),(1723,'Git','git','',14,1,1,'topic'),(1724,'C#','csharp','',15,1,1,'topic'),(1725,'PHP','php','',16,1,1,'topic'),(1726,'Rust','rust','',17,1,1,'topic'),(1727,'Repo Hosting Services','repo-hosting-services','',18,1,1,'milestone'),(1728,'GitHub','github','',19,1,1,'topic'),(1729,'GitLab','gitlab','',20,1,1,'topic'),(1730,'Bitbucket','bitbucket','',21,1,1,'topic'),(1731,'Relational Databases','relational-databases','',22,1,1,'milestone'),(1732,'PostgreSQL','postgresql','',23,1,1,'topic'),(1733,'MySQL','mysql','',24,1,1,'topic'),(1734,'MariaDB','mariadb','',25,1,1,'topic'),(1735,'MS SQL','mssql','',26,1,1,'topic'),(1736,'Oracle','oracle','',27,1,1,'topic'),(1737,'SQLite','sqlite','',28,1,1,'topic'),(1738,'Learn about APIs','learn-about-apis','',29,1,1,'milestone'),(1739,'HATEOAS','hateoas','',30,1,1,'topic'),(1740,'Open API Specs','open-api-specs','',31,1,1,'topic'),(1741,'REST','rest','',32,1,1,'topic'),(1742,'JSON APIs','json-apis','',33,1,1,'topic'),(1743,'SOAP','soap','',34,1,1,'topic'),(1744,'gRPC','grpc','',35,1,1,'topic'),(1745,'GraphQL','graphql-api','',36,1,1,'topic'),(1746,'Authentication','authentication','',37,1,1,'milestone'),(1747,'JWT','jwt','',38,1,1,'topic'),(1748,'OAuth','oauth','',39,1,1,'topic'),(1749,'Basic Authentication','basic-authentication','',40,1,1,'topic'),(1750,'Token Authentication','token-authentication','',41,1,1,'topic'),(1751,'Cookie Based Auth','cookie-based-auth','',42,1,1,'topic'),(1752,'OpenID','openid','',43,1,1,'topic'),(1753,'SAML','saml','',44,1,1,'topic'),(1754,'Caching','caching','',45,1,1,'milestone'),(1755,'Server Side','server-side','',46,1,1,'topic'),(1756,'CDN','cdn','',47,1,1,'topic'),(1757,'Client Side','client-side','',48,1,1,'topic'),(1758,'Web Security','web-security','',49,1,1,'milestone'),(1759,'MD5','md5','',50,1,1,'topic'),(1760,'SHA','sha','',51,1,1,'topic'),(1761,'scrypt','scrypt','',52,1,1,'topic'),(1762,'bcrypt','bcrypt','',53,1,1,'topic'),(1763,'Web Security Essentials','web-security-essentials','',54,1,1,'milestone'),(1764,'HTTPS','https','',55,1,1,'topic'),(1765,'OWASP Risks','owasp-risks','',56,1,1,'topic'),(1766,'CORS','cors','',57,1,1,'topic'),(1767,'SSL/TLS','ssl-tls','',58,1,1,'topic'),(1768,'CSP','csp','',59,1,1,'topic'),(1769,'Server Security','server-security','',60,1,1,'topic'),(1770,'API Security Best Practices','api-security-best-practices','',61,1,1,'topic'),(1771,'Testing','testing','',62,1,1,'milestone'),(1772,'Integration Testing','integration-testing','',63,1,1,'topic'),(1773,'Unit Testing','unit-testing','',64,1,1,'topic'),(1774,'Functional Testing','functional-testing','',65,1,1,'topic'),(1775,'CI / CD','ci-cd','',66,1,1,'milestone'),(1776,'More about Databases','more-about-databases','',67,1,1,'milestone'),(1777,'ORMs','orms','',68,1,1,'topic'),(1778,'ACID','acid','',69,1,1,'topic'),(1779,'Transactions','transactions','',70,1,1,'topic'),(1780,'N+1 Problem','n-plus-1-problem','',71,1,1,'topic'),(1781,'Normalization','normalization','',72,1,1,'topic'),(1782,'Failure Modes','failure-modes','',73,1,1,'topic'),(1783,'Profiling Perfor.','profiling-performance','',74,1,1,'topic'),(1784,'Migrations','migrations','',75,1,1,'topic'),(1785,'Scaling Databases','scaling-databases','',76,1,1,'milestone'),(1786,'Database Indexes','database-indexes','',77,1,1,'topic'),(1787,'Data Replication','data-replication','',78,1,1,'topic'),(1788,'Sharding Strategies','sharding-strategies','',79,1,1,'topic'),(1789,'CAP Theorem','cap-theorem','',80,1,1,'topic'),(1790,'Software Design & Architecture','software-design-architecture','',81,1,1,'milestone'),(1791,'Architectural Patterns','architectural-patterns','',82,1,1,'milestone'),(1792,'Monolithic Apps','monolithic-apps','',83,1,1,'topic'),(1793,'Microservices','microservices','',84,1,1,'topic'),(1794,'SOA','soa','',85,1,1,'topic'),(1795,'Serverless','serverless','',86,1,1,'topic'),(1796,'Service Mesh','service-mesh','',87,1,1,'topic'),(1797,'Twelve Factor Apps','twelve-factor-apps','',88,1,1,'topic'),(1798,'Design and Development Principles','design-and-development-principles','',89,1,1,'milestone'),(1799,'GOF Design Patterns','gof-design-patterns','',90,1,1,'topic'),(1800,'Domain Driven Design','domain-driven-design','',91,1,1,'topic'),(1801,'Test Driven Development','test-driven-development','',92,1,1,'topic'),(1802,'CQRS','cqrs','',93,1,1,'topic'),(1803,'Event Sourcing','event-sourcing','',94,1,1,'topic'),(1804,'Containerization vs Virtualization','containerization-vs-virtualization','',95,1,1,'milestone'),(1805,'Docker','docker','',96,1,1,'milestone'),(1806,'LXC','lxc','',97,1,1,'topic'),(1807,'Kubernetes','kubernetes','',98,1,1,'milestone'),(1808,'Message Brokers','message-brokers','',99,1,1,'milestone'),(1809,'RabbitMQ','rabbitmq','',100,1,1,'topic'),(1810,'Kafka','kafka','',101,1,1,'topic'),(1811,'Search Engines','search-engines','',102,1,1,'milestone'),(1812,'Elasticsearch','elasticsearch','',103,1,1,'topic'),(1813,'Solr','solr','',104,1,1,'topic'),(1814,'Web Servers','web-servers','',105,1,1,'milestone'),(1815,'Nginx','nginx','',106,1,1,'topic'),(1816,'Apache','apache','',107,1,1,'topic'),(1817,'Caddy','caddy','',108,1,1,'topic'),(1818,'MS IIS','ms-iis','',109,1,1,'topic'),(1819,'Real-Time Data','real-time-data','',110,1,1,'milestone'),(1820,'Server Sent Events','server-sent-events','',111,1,1,'topic'),(1821,'WebSockets','websockets','',112,1,1,'topic'),(1822,'Long Polling','long-polling','',113,1,1,'topic'),(1823,'Short Polling','short-polling','',114,1,1,'topic'),(1824,'GraphQL','graphql-tooling','',115,1,1,'milestone'),(1825,'NoSQL Databases','nosql-databases','',116,1,1,'milestone'),(1826,'Document DBs','document-dbs','',117,1,1,'milestone'),(1827,'MongoDB','mongodb','',118,1,1,'topic'),(1828,'CouchDB','couchdb','',119,1,1,'topic'),(1829,'Key-Value','key-value-stores','',120,1,1,'milestone'),(1830,'Redis','redis','',121,1,1,'topic'),(1831,'DynamoDB','dynamodb','',122,1,1,'topic'),(1832,'Realtime','realtime-dbs','',123,1,1,'milestone'),(1833,'Firebase','firebase','',124,1,1,'topic'),(1834,'RethinkDB','rethinkdb','',125,1,1,'topic'),(1835,'Time Series','time-series-dbs','',126,1,1,'milestone'),(1836,'Influx DB','influxdb','',127,1,1,'topic'),(1837,'TimeScale','timescale','',128,1,1,'topic'),(1838,'Column DBs','column-dbs','',129,1,1,'milestone'),(1839,'Cassandra','cassandra','',130,1,1,'topic'),(1840,'Base','base','',131,1,1,'topic'),(1841,'Graph DBs','graph-dbs','',132,1,1,'milestone'),(1842,'Neo4j','neo4j','',133,1,1,'topic'),(1843,'AWS Neptune','aws-neptune','',134,1,1,'topic'),(1844,'Building For Scale','building-for-scale','',135,1,1,'milestone'),(1845,'Migration Strategies','migration-strategies','',136,1,1,'topic'),(1846,'Types of Scaling','types-of-scaling','',137,1,1,'topic'),(1847,'Mitigation Strategies','mitigation-strategies','',138,1,1,'milestone'),(1848,'Graceful Degradation','graceful-degradation','',139,1,1,'topic'),(1849,'Throttling','throttling','',140,1,1,'topic'),(1850,'Backpressure','backpressure','',141,1,1,'topic'),(1851,'Loadshifting','loadshifting','',142,1,1,'topic'),(1852,'Circuit Breaker','circuit-breaker','',143,1,1,'topic'),(1853,'Monitoring & Observability','monitoring-and-observability','',144,1,1,'milestone'),(1854,'Instrumentation','instrumentation','',145,1,1,'topic'),(1855,'Monitoring','monitoring','',146,1,1,'topic'),(1856,'Telemetry','telemetry','',147,1,1,'topic'),(1857,'Observability','observability','',148,1,1,'topic'),(1858,'Pick a Language','pick-a-language','',0,5,1,'milestone'),(1859,'C#','c','',1,5,1,'topic'),(1860,'C++','pick-a-language-c','',2,5,1,'topic'),(1861,'Python','python','',3,5,1,'topic'),(1862,'Rust','rust','',4,5,1,'topic'),(1863,'JavaScript','javascript','',5,5,1,'topic'),(1864,'Java','java','',6,5,1,'topic'),(1865,'Go','go','',7,5,1,'topic'),(1866,'Ruby','ruby','',8,5,1,'topic'),(1867,'Programming Fundamentals','programming-fundamentals','',9,5,1,'milestone'),(1868,'Language Syntax','language-syntax','',10,5,1,'topic'),(1869,'Control Structures','control-structures','',11,5,1,'topic'),(1870,'Pseudo Code','pseudo-code','',12,5,1,'topic'),(1871,'Functions','functions','',13,5,1,'topic'),(1872,'OOP Basics','oop-basics','',14,5,1,'topic'),(1873,'What are Data Structures?','what-are-data-structures','',15,5,1,'milestone'),(1874,'Why are Data Structures Important?','why-are-data-structures-important','',16,5,1,'topic'),(1875,'Algorithmic Complexity','algorithmic-complexity','',17,5,1,'milestone'),(1876,'Time vs Space Complexity','time-vs-space-complexity','',18,5,1,'topic'),(1877,'How to Calculate Complexity?','how-to-calculate-complexity','',19,5,1,'topic'),(1878,'Asymptotic Notation','asymptotic-notation','',20,5,1,'topic'),(1879,'Big-O Notation','big-o-notation','',21,5,1,'topic'),(1880,'Common Runtimes','common-runtimes','',22,5,1,'topic'),(1881,'Constant','constant','',23,5,1,'topic'),(1882,'Logarithmic','logarithmic','',24,5,1,'topic'),(1883,'Linear','linear','',25,5,1,'topic'),(1884,'Polynomial','polynomial','',26,5,1,'topic'),(1885,'Exponential','exponential','',27,5,1,'topic'),(1886,'Factorial','factorial','',28,5,1,'topic'),(1887,'Basic Data Structures','basic-data-structures','',29,5,1,'milestone'),(1888,'Array','array','',30,5,1,'topic'),(1889,'Linked Lists','linked-lists','',31,5,1,'topic'),(1890,'Stacks','stacks','',32,5,1,'topic'),(1891,'Queues','queues','',33,5,1,'topic'),(1892,'Hash Tables','hash-tables','',34,5,1,'topic'),(1893,'Sorting Algorithms','sorting-algorithms','',35,5,1,'milestone'),(1894,'Bubble Sort','bubble-sort','',36,5,1,'topic'),(1895,'Insertion Sort','insertion-sort','',37,5,1,'topic'),(1896,'Selection Sort','selection-sort','',38,5,1,'topic'),(1897,'Merge Sort','merge-sort','',39,5,1,'topic'),(1898,'Quick Sort','quick-sort','',40,5,1,'topic'),(1899,'Heap Sort','heap-sort','',41,5,1,'topic'),(1900,'Search Algorithms','search-algorithms','',42,5,1,'milestone'),(1901,'Linear Search','linear-search','',43,5,1,'topic'),(1902,'Binary Search','binary-search','',44,5,1,'topic'),(1903,'Tree Data Structures','tree-data-structures','',45,5,1,'milestone'),(1904,'Binary Trees','binary-trees','',46,5,1,'topic'),(1905,'Binary Search Trees','binary-search-trees','',47,5,1,'topic'),(1906,'AVL Trees','avl-trees','',48,5,1,'topic'),(1907,'B-Trees','b-trees','',49,5,1,'topic'),(1908,'Heap','heap','',50,5,1,'topic'),(1909,'Trie','trie','',51,5,1,'topic'),(1910,'Tree Traversal','tree-traversal','',52,5,1,'milestone'),(1911,'In-Order Traversal','in-order-traversal','',53,5,1,'topic'),(1912,'Pre-Order Traversal','pre-order-traversal','',54,5,1,'topic'),(1913,'Post-Order Traversal','post-order-traversal','',55,5,1,'topic'),(1914,'Breadth First Search','breadth-first-search','',56,5,1,'topic'),(1915,'Depth First Search','depth-first-search','',57,5,1,'topic'),(1916,'Graph Data Structures','graph-data-structures','',58,5,1,'milestone'),(1917,'Directed Graph','directed-graph','',59,5,1,'topic'),(1918,'Undirected Graph','undirected-graph','',60,5,1,'topic'),(1919,'Graph Search','graph-search','',61,5,1,'milestone'),(1920,'Breadth First Search','graph-search-breadth-first-search','',62,5,1,'topic'),(1921,'Depth First Search','graph-search-depth-first-search','',63,5,1,'topic'),(1922,'Shortest Path Algorithms','shortest-path-algorithms','',64,5,1,'milestone'),(1923,'Dijkstra\'s Algorithm','dijkstra-s-algorithm','',65,5,1,'topic'),(1924,'Bellman-Ford Algorithm','bellman-ford-algorithm','',66,5,1,'topic'),(1925,'A* Algorithm','a-algorithm','',67,5,1,'topic'),(1926,'Minimum Spanning Tree','minimum-spanning-tree','',68,5,1,'milestone'),(1927,'Prim\'s Algorithm','prim-s-algorithm','',69,5,1,'topic'),(1928,'Kruskal\'s Algorithm','kruskal-s-algorithm','',70,5,1,'topic'),(1929,'Advanced Data Structures','advanced-data-structures','',71,5,1,'milestone'),(1930,'2-3 Trees','2-3-trees','',72,5,1,'topic'),(1931,'B/B+ Trees','b-b-trees','',73,5,1,'topic'),(1932,'Skip List','skip-list','',74,5,1,'topic'),(1933,'ISAM','isam','',75,5,1,'topic'),(1934,'Complex Data Structures','complex-data-structures','',76,5,1,'milestone'),(1935,'Segment Trees','segment-trees','',77,5,1,'topic'),(1936,'Fenwick Trees','fenwick-trees','',78,5,1,'topic'),(1937,'Disjoint Set (Union-Find)','disjoint-set-union-find','',79,5,1,'topic'),(1938,'Suffix Trees and Arrays','suffix-trees-and-arrays','',80,5,1,'topic'),(1939,'Indexing','indexing','',81,5,1,'milestone'),(1940,'Linear','indexing-linear','',82,5,1,'topic'),(1941,'Tree-Based','tree-based','',83,5,1,'topic'),(1942,'Problem Solving Techniques','problem-solving-techniques','',84,5,1,'milestone'),(1943,'Brute Force','brute-force','',85,5,1,'topic'),(1944,'Backtracking','backtracking','',86,5,1,'topic'),(1945,'Greedy Algorithms','greedy-algorithms','',87,5,1,'topic'),(1946,'Divide and Conquer','divide-and-conquer','',88,5,1,'topic'),(1947,'Recursion','recursion','',89,5,1,'topic'),(1948,'Dynamic Programming','dynamic-programming','',90,5,1,'topic'),(1949,'Randomised Algorithms','randomised-algorithms','',91,5,1,'topic'),(1950,'Advanced Techniques','advanced-techniques','',92,5,1,'milestone'),(1951,'Two Pointer Technique','two-pointer-technique','',93,5,1,'topic'),(1952,'Fast and Slow Pointers','fast-and-slow-pointers','',94,5,1,'topic'),(1953,'Sliding Window Technique','sliding-window-technique','',95,5,1,'topic'),(1954,'Merge Intervals','merge-intervals','',96,5,1,'topic'),(1955,'Cyclic Sort','cyclic-sort','',97,5,1,'topic'),(1956,'Two Heaps','two-heaps','',98,5,1,'topic'),(1957,'Kth Element','kth-element','',99,5,1,'topic'),(1958,'Island traversal','island-traversal','',100,5,1,'topic'),(1959,'Multi-threaded','multi-threaded','',101,5,1,'topic'),(1960,'Platforms to Practice','platforms-to-practice','',102,5,1,'milestone'),(1961,'Leetcode','leetcode','',103,5,1,'topic'),(1962,'Edabit','edabit','',104,5,1,'topic'),(1963,'Introduction','introduction','',0,6,1,'milestone'),(1964,'How the Web Works','how-the-web-works','',1,6,1,'topic'),(1965,'Why use web frameworks','why-use-web-frameworks','',2,6,1,'topic'),(1966,'The MVC Model','the-mvc-model','',3,6,1,'topic'),(1967,'Virtual envs','virtual-envs','',4,6,1,'topic'),(1968,'Installing Django','installing-django','',5,6,1,'topic'),(1969,'Your First Project','your-first-project','',6,6,1,'milestone'),(1970,'Projects & Apps','projects-apps','',7,6,1,'topic'),(1971,'Running your Project','running-your-project','',8,6,1,'topic'),(1972,'Project Structure','project-structure','',9,6,1,'milestone'),(1973,'manage.py','manage-py','',10,6,1,'topic'),(1974,'settings.py','settings-py','',11,6,1,'topic'),(1975,'urls.py','urls-py','',12,6,1,'topic'),(1976,'App Structure','app-structure','',13,6,1,'milestone'),(1977,'models.py','models-py','',14,6,1,'topic'),(1978,'views.py','views-py','',15,6,1,'topic'),(1979,'tests.py','tests-py','',16,6,1,'topic'),(1980,'admin.py','admin-py','',17,6,1,'topic'),(1981,'migrations','migrations','',18,6,1,'topic'),(1982,'urls.py','app-structure-urls-py','',19,6,1,'topic'),(1983,'Other Files','other-files','',20,6,1,'milestone'),(1984,'static','static','',21,6,1,'topic'),(1985,'media','media','',22,6,1,'topic'),(1986,'templates','templates','',23,6,1,'topic'),(1987,'Routing','routing','',24,6,1,'milestone'),(1988,'URL patterns','url-patterns','',25,6,1,'topic'),(1989,'Path converters','path-converters','',26,6,1,'topic'),(1990,'Grouping URLs','grouping-urls','',27,6,1,'topic'),(1991,'Regex Paths','regex-paths','',28,6,1,'topic'),(1992,'Named URLs','named-urls','',29,6,1,'topic'),(1993,'Reverse URL','reverse-url','',30,6,1,'topic'),(1994,'Routing Middleware','routing-middleware','',31,6,1,'topic'),(1995,'Views','views','',32,6,1,'milestone'),(1996,'Function-based views','function-based-views','',33,6,1,'topic'),(1997,'Class-based views','class-based-views','',34,6,1,'topic'),(1998,'Generic views','generic-views','',35,6,1,'topic'),(1999,'ListView','listview','',36,6,1,'topic'),(2000,'DetailView','detailview','',37,6,1,'topic'),(2001,'CreateView','createview','',38,6,1,'topic'),(2002,'UpdateView','updateview','',39,6,1,'topic'),(2003,'DeleteView','deleteview','',40,6,1,'topic'),(2004,'Customizing Views','customizing-views','',41,6,1,'topic'),(2005,'Rendering Templates','rendering-templates','',42,6,1,'topic'),(2006,'Templates','templates-2','',43,6,1,'milestone'),(2007,'DTL Syntax','dtl-syntax','',44,6,1,'topic'),(2008,'Variables','variables','',45,6,1,'topic'),(2009,'Filters & custom filters','filters-custom-filters','',46,6,1,'topic'),(2010,'Tags & custom tags','tags-custom-tags','',47,6,1,'topic'),(2011,'for','for','',48,6,1,'topic'),(2012,'if','if','',49,6,1,'topic'),(2013,'Comments','comments','',50,6,1,'topic'),(2014,'Template Inheritance','template-inheritance','',51,6,1,'topic'),(2015,'Models','models','',52,6,1,'milestone'),(2016,'Model Fields','model-fields','',53,6,1,'topic'),(2017,'Field types','field-types','',54,6,1,'topic'),(2018,'Field options','field-options','',55,6,1,'topic'),(2019,'Custom fields','custom-fields','',56,6,1,'topic'),(2020,'Model relationships','model-relationships','',57,6,1,'topic'),(2021,'Model methods','model-methods','',58,6,1,'topic'),(2022,'Model inheritance','model-inheritance','',59,6,1,'topic'),(2023,'Models, Databases & ORM','models-databases-orm','',60,6,1,'milestone'),(2024,'Setting up the Database','setting-up-the-database','',61,6,1,'topic'),(2025,'Supported DBs','supported-dbs','',62,6,1,'topic'),(2026,'SQLite','sqlite','',63,6,1,'topic'),(2027,'PostgreSQL','postgresql','',64,6,1,'topic'),(2028,'MySQL','mysql','',65,6,1,'topic'),(2029,'MariaDB','mariadb','',66,6,1,'topic'),(2030,'Django ORM','django-orm','',67,6,1,'milestone'),(2031,'Querying data','querying-data','',68,6,1,'topic'),(2032,'Create, Update, Delete','create-update-delete','',69,6,1,'topic'),(2033,'Aggregations','aggregations','',70,6,1,'topic'),(2034,'Filtering & lookups','filtering-lookups','',71,6,1,'topic'),(2035,'Raw SQL','raw-sql','',72,6,1,'topic'),(2036,'Query Optimization','query-optimization','',73,6,1,'topic'),(2037,'Migrations','migrations-2','',74,6,1,'milestone'),(2038,'Django Migrations','django-migrations','',75,6,1,'topic'),(2039,'Django Forms','django-forms','',76,6,1,'milestone'),(2040,'Model Forms','model-forms','',77,6,1,'topic'),(2041,'Form Validation','form-validation','',78,6,1,'topic'),(2042,'Validation','validation','',79,6,1,'topic'),(2043,'Django Admin','django-admin','',80,6,1,'milestone'),(2044,'Customization','customization','',81,6,1,'topic'),(2045,'Admin Customization','admin-customization','',82,6,1,'topic'),(2046,'Middleware','middleware','',83,6,1,'milestone'),(2047,'Request Response Flow','request-response-flow','',84,6,1,'topic'),(2048,'Authentication','authentication','',85,6,1,'milestone'),(2049,'Built-in user model','built-in-user-model','',86,6,1,'topic'),(2050,'Custom user model','custom-user-model','',87,6,1,'topic'),(2051,'Users & Permissions','users-permissions','',88,6,1,'topic'),(2052,'Authorization','authorization','',89,6,1,'milestone'),(2053,'Protecting views','protecting-views','',90,6,1,'topic'),(2054,'django-allauth','django-allauth','',91,6,1,'topic'),(2055,'API Development','api-development','',92,6,1,'milestone'),(2056,'Django REST Framework','django-rest-framework','',93,6,1,'topic'),(2057,'Serializers','serializers','',94,6,1,'topic'),(2058,'Views & ViewSets','views-viewsets','',95,6,1,'topic'),(2059,'Routers','routers','',96,6,1,'topic'),(2060,'Logging','logging','',97,6,1,'milestone'),(2061,'Logging framework','logging-framework','',98,6,1,'topic'),(2062,'Loggers','loggers','',99,6,1,'topic'),(2063,'Handlers','handlers','',100,6,1,'topic'),(2064,'Filters','filters','',101,6,1,'topic'),(2065,'Formatters','formatters','',102,6,1,'topic'),(2066,'Debugging','debugging','',103,6,1,'milestone'),(2067,'Error Pages','error-pages','',104,6,1,'topic'),(2068,'debug_toolbar','debug-toolbar','',105,6,1,'topic'),(2069,'PDB, IPDB','pdb-ipdb','',106,6,1,'topic'),(2070,'django_silk','django-silk','',107,6,1,'topic'),(2071,'Django Test Framework','django-test-framework','',108,6,1,'milestone'),(2072,'pytest','pytest','',109,6,1,'topic'),(2073,'unittest & TestCase','unittest-testcase','',110,6,1,'topic'),(2074,'Static Files','static-files','',111,6,1,'milestone'),(2075,'Whitenoise','whitenoise','',112,6,1,'topic'),(2076,'Advanced Topics','advanced-topics','',113,6,1,'milestone'),(2077,'Pagination','pagination','',114,6,1,'topic'),(2078,'Message Framework','message-framework','',115,6,1,'topic'),(2079,'Django Shell','django-shell','',116,6,1,'topic'),(2080,'Caching','caching','',117,6,1,'topic'),(2081,'Asynchronous Django','asynchronous-django','',118,6,1,'topic'),(2082,'Background Tasks','background-tasks','',119,6,1,'topic'),(2083,'Localization','localization','',120,6,1,'topic'),(2084,'Signals','signals','',121,6,1,'topic'),(2085,'Deployment','deployment','',122,6,1,'milestone'),(2086,'Production Checklist','production-checklist','',123,6,1,'topic'),(2087,'Internet','internet','',0,2,1,'milestone'),(2088,'How does the internet work?','how-does-the-internet-work','',1,2,1,'topic'),(2089,'What is HTTP?','what-is-http','',2,2,1,'topic'),(2090,'What is Domain Name?','what-is-domain-name','',3,2,1,'topic'),(2091,'What is hosting?','what-is-hosting','',4,2,1,'topic'),(2092,'DNS and how it works?','dns-and-how-it-works','',5,2,1,'topic'),(2093,'Browsers and how they work?','browsers-and-how-they-work','',6,2,1,'topic'),(2094,'HTML','html','',7,2,1,'milestone'),(2095,'Learn the Basics','learn-the-basics','',8,2,1,'topic'),(2096,'Writing Semantic HTML','writing-semantic-html','',9,2,1,'topic'),(2097,'Forms and Validations','forms-and-validations','',10,2,1,'topic'),(2098,'Accessibility','accessibility','',11,2,1,'topic'),(2099,'SEO Basics','seo-basics','',12,2,1,'topic'),(2100,'CSS','css','',13,2,1,'milestone'),(2101,'Learn the Basics','css-learn-the-basics','',14,2,1,'topic'),(2102,'Making Layouts','making-layouts','',15,2,1,'topic'),(2103,'Responsive Design','responsive-design','',16,2,1,'topic'),(2104,'CSS Architecture','css-architecture','',17,2,1,'topic'),(2105,'BEM','bem','',18,2,1,'topic'),(2106,'CSS Preprocessors','css-preprocessors','',19,2,1,'topic'),(2107,'Sass','sass','',20,2,1,'topic'),(2108,'PostCSS','postcss','',21,2,1,'topic'),(2109,'JavaScript','javascript','',22,2,1,'milestone'),(2110,'Learn DOM Manipulation','learn-dom-manipulation','',23,2,1,'topic'),(2111,'Fetch API / Ajax (XHR)','fetch-api-ajax-xhr','',24,2,1,'topic'),(2112,'CORS','cors','',25,2,1,'topic'),(2113,'HTTPS','https','',26,2,1,'topic'),(2114,'Version Control Systems','version-control-systems','',27,2,1,'milestone'),(2115,'Git','git','',28,2,1,'topic'),(2116,'VCS Hosting','vcs-hosting','',29,2,1,'milestone'),(2117,'GitHub','github','',30,2,1,'topic'),(2118,'GitLab','gitlab','',31,2,1,'topic'),(2119,'Bitbucket','bitbucket','',32,2,1,'topic'),(2120,'Package Managers','package-managers','',33,2,1,'milestone'),(2121,'npm','npm','',34,2,1,'topic'),(2122,'pnpm','pnpm','',35,2,1,'topic'),(2123,'yarn','yarn','',36,2,1,'topic'),(2124,'Pick a Framework','pick-a-framework','',37,2,1,'milestone'),(2125,'React','react','',38,2,1,'topic'),(2126,'Vue.js','vue-js','',39,2,1,'topic'),(2127,'Angular','angular','',40,2,1,'topic'),(2128,'Svelte','svelte','',41,2,1,'topic'),(2129,'Solid JS','solid-js','',42,2,1,'topic'),(2130,'Qwik','qwik','',43,2,1,'topic'),(2131,'Writing CSS','writing-css','',44,2,1,'milestone'),(2132,'Tailwind','tailwind','',45,2,1,'topic'),(2133,'CSS Modules','css-modules','',46,2,1,'topic'),(2134,'Styled Components','styled-components','',47,2,1,'topic'),(2135,'Build Tools','build-tools','',48,2,1,'milestone'),(2136,'Vite','vite','',49,2,1,'topic'),(2137,'Webpack','webpack','',50,2,1,'topic'),(2138,'Rollup','rollup','',51,2,1,'topic'),(2139,'Parcel','parcel','',52,2,1,'topic'),(2140,'esbuild','esbuild','',53,2,1,'topic'),(2141,'SWC','swc','',54,2,1,'topic'),(2142,'Linters and Formatters','linters-and-formatters','',55,2,1,'milestone'),(2143,'Prettier','prettier','',56,2,1,'topic'),(2144,'ESLint','eslint','',57,2,1,'topic'),(2145,'Testing','testing','',58,2,1,'milestone'),(2146,'Vitest','vitest','',59,2,1,'topic'),(2147,'Jest','jest','',60,2,1,'topic'),(2148,'Playwright','playwright','',61,2,1,'topic'),(2149,'Cypress','cypress','',62,2,1,'topic'),(2150,'Type Checkers','type-checkers','',63,2,1,'milestone'),(2151,'TypeScript','typescript','',64,2,1,'topic'),(2152,'Web Security Basics','web-security-basics','',65,2,1,'milestone'),(2153,'OWASP Security Risks','owasp-security-risks','',66,2,1,'topic'),(2154,'Content Security Policy','content-security-policy','',67,2,1,'topic'),(2155,'Authentication Strategies','authentication-strategies','',68,2,1,'milestone'),(2156,'JWT','jwt','',69,2,1,'topic'),(2157,'OAuth','oauth','',70,2,1,'topic'),(2158,'SSO','sso','',71,2,1,'topic'),(2159,'Basic Auth','basic-auth','',72,2,1,'topic'),(2160,'Session Auth','session-auth','',73,2,1,'topic'),(2161,'Web Components','web-components','',74,2,1,'milestone'),(2162,'HTML Templates','html-templates','',75,2,1,'topic'),(2163,'Custom Elements','custom-elements','',76,2,1,'topic'),(2164,'Shadow DOM','shadow-dom','',77,2,1,'topic'),(2165,'SSR','ssr','',78,2,1,'milestone'),(2166,'Next.js','next-js','',79,2,1,'topic'),(2167,'Nuxt.js','nuxt-js','',80,2,1,'topic'),(2168,'Svelte Kit','svelte-kit','',81,2,1,'topic'),(2169,'Astro','astro','',82,2,1,'topic'),(2170,'GraphQL','graphql','',83,2,1,'milestone'),(2171,'Apollo','apollo','',84,2,1,'topic'),(2172,'Relay Modern','relay-modern','',85,2,1,'topic'),(2173,'Static Site Generators','static-site-generators','',86,2,1,'milestone'),(2174,'Eleventy','eleventy','',87,2,1,'topic'),(2175,'Vuepress','vuepress','',88,2,1,'topic'),(2176,'Astro','static-site-generators-astro','',89,2,1,'topic'),(2177,'Mobile Apps','mobile-apps','',90,2,1,'milestone'),(2178,'React Native','react-native','',91,2,1,'topic'),(2179,'Flutter','flutter','',92,2,1,'topic'),(2180,'Ionic','ionic','',93,2,1,'topic'),(2181,'Desktop Apps','desktop-apps','',94,2,1,'milestone'),(2182,'Electron','electron','',95,2,1,'topic'),(2183,'Tauri','tauri','',96,2,1,'topic'),(2184,'Flutter','desktop-apps-flutter','',97,2,1,'topic'),(2185,'Performance Best Practices','performance-best-practices','',98,2,1,'milestone'),(2186,'PRPL Pattern','prpl-pattern','',99,2,1,'topic'),(2187,'RAIL Model','rail-model','',100,2,1,'topic'),(2188,'Performance Metrics','performance-metrics','',101,2,1,'topic'),(2189,'Using Lighthouse','using-lighthouse','',102,2,1,'topic'),(2190,'Using DevTools','using-devtools','',103,2,1,'topic'),(2191,'Browser APIs','browser-apis','',104,2,1,'milestone'),(2192,'Web Sockets','web-sockets','',105,2,1,'topic'),(2193,'Server Sent Events','server-sent-events','',106,2,1,'topic'),(2194,'Service Workers','service-workers','',107,2,1,'topic'),(2195,'Storage','storage','',108,2,1,'topic'),(2196,'Location','location','',109,2,1,'topic'),(2197,'Notifications','notifications','',110,2,1,'topic'),(2198,'Device Orientation','device-orientation','',111,2,1,'topic'),(2199,'Payments','payments','',112,2,1,'topic'),(2200,'Credentials','credentials','',113,2,1,'topic'),(2201,'PWAs','pwas','',114,2,1,'milestone'),(2202,'Progressive Web Apps','progressive-web-apps','',115,2,1,'topic'),(2203,'Learn the Basics','learn-the-basics','',0,7,1,'milestone'),(2204,'What are Relational Databases?','what-are-relational-databases','',1,7,1,'topic'),(2205,'RDBMS Benefits and Limitations','rdbms-benefits-and-limitations','',2,7,1,'topic'),(2206,'SQL vs NoSQL Databases','sql-vs-nosql-databases','',3,7,1,'topic'),(2207,'Basic SQL Syntax','basic-sql-syntax','',4,7,1,'topic'),(2208,'SQL Keywords','sql-keywords','',5,7,1,'topic'),(2209,'Data Types','data-types','',6,7,1,'topic'),(2210,'Operators','operators','',7,7,1,'topic'),(2211,'Data Definition Language (DDL)','data-definition-language-ddl','',8,7,1,'milestone'),(2212,'Create Table','create-table','',9,7,1,'topic'),(2213,'Alter Table','alter-table','',10,7,1,'topic'),(2214,'Drop Table','drop-table','',11,7,1,'topic'),(2215,'Truncate Table','truncate-table','',12,7,1,'topic'),(2216,'Data Manipulation Language (DML)','data-manipulation-language-dml','',13,7,1,'milestone'),(2217,'SELECT','select','',14,7,1,'topic'),(2218,'INSERT','insert','',15,7,1,'topic'),(2219,'UPDATE','update','',16,7,1,'topic'),(2220,'DELETE','delete','',17,7,1,'topic'),(2221,'Data Constraints','data-constraints','',18,7,1,'milestone'),(2222,'Primary Key','primary-key','',19,7,1,'topic'),(2223,'Foreign Key','foreign-key','',20,7,1,'topic'),(2224,'Unique','unique','',21,7,1,'topic'),(2225,'NOT NULL','not-null','',22,7,1,'topic'),(2226,'CHECK','check','',23,7,1,'topic'),(2227,'Statements','statements','',24,7,1,'milestone'),(2228,'FROM','from','',25,7,1,'topic'),(2229,'WHERE','where','',26,7,1,'topic'),(2230,'GROUP BY','group-by','',27,7,1,'topic'),(2231,'ORDER BY','order-by','',28,7,1,'topic'),(2232,'HAVING','having','',29,7,1,'topic'),(2233,'Aggregate Queries','aggregate-queries','',30,7,1,'milestone'),(2234,'SUM','sum','',31,7,1,'topic'),(2235,'COUNT','count','',32,7,1,'topic'),(2236,'AVG','avg','',33,7,1,'topic'),(2237,'MIN','min','',34,7,1,'topic'),(2238,'MAX','max','',35,7,1,'topic'),(2239,'JOIN Queries','join-queries','',36,7,1,'milestone'),(2240,'INNER JOIN','inner-join','',37,7,1,'topic'),(2241,'LEFT JOIN','left-join','',38,7,1,'topic'),(2242,'RIGHT JOIN','right-join','',39,7,1,'topic'),(2243,'FULL OUTER JOIN','full-outer-join','',40,7,1,'topic'),(2244,'Self Join','self-join','',41,7,1,'topic'),(2245,'Cross Join','cross-join','',42,7,1,'topic'),(2246,'Subqueries','subqueries','',43,7,1,'milestone'),(2247,'Nested Subqueries','nested-subqueries','',44,7,1,'topic'),(2248,'Correlated Subqueries','correlated-subqueries','',45,7,1,'topic'),(2249,'Different Types','different-types','',46,7,1,'topic'),(2250,'Scalar','scalar','',47,7,1,'topic'),(2251,'Column','column','',48,7,1,'topic'),(2252,'Row','row','',49,7,1,'topic'),(2253,'Table','table','',50,7,1,'topic'),(2254,'String Functions','string-functions','',51,7,1,'milestone'),(2255,'CONCAT','concat','',52,7,1,'topic'),(2256,'LENGTH','length','',53,7,1,'topic'),(2257,'SUBSTRING','substring','',54,7,1,'topic'),(2258,'REPLACE','replace','',55,7,1,'topic'),(2259,'UPPER','upper','',56,7,1,'topic'),(2260,'LOWER','lower','',57,7,1,'topic'),(2261,'Numeric Functions','numeric-functions','',58,7,1,'milestone'),(2262,'ABS','abs','',59,7,1,'topic'),(2263,'ROUND','round','',60,7,1,'topic'),(2264,'CEILING','ceiling','',61,7,1,'topic'),(2265,'FLOOR','floor','',62,7,1,'topic'),(2266,'MOD','mod','',63,7,1,'topic'),(2267,'Date and Time','date-and-time','',64,7,1,'milestone'),(2268,'DATE','date','',65,7,1,'topic'),(2269,'TIME','time','',66,7,1,'topic'),(2270,'TIMESTAMP','timestamp','',67,7,1,'topic'),(2271,'DATEPART','datepart','',68,7,1,'topic'),(2272,'DATEADD','dateadd','',69,7,1,'topic'),(2273,'Conditional','conditional','',70,7,1,'milestone'),(2274,'CASE','case','',71,7,1,'topic'),(2275,'NULLIF','nullif','',72,7,1,'topic'),(2276,'COALESCE','coalesce','',73,7,1,'topic'),(2277,'Advanced Functions','advanced-functions','',74,7,1,'milestone'),(2278,'Window Functions','window-functions','',75,7,1,'topic'),(2279,'rank','rank','',76,7,1,'topic'),(2280,'dense_rank','dense-rank','',77,7,1,'topic'),(2281,'lead','lead','',78,7,1,'topic'),(2282,'lag','lag','',79,7,1,'topic'),(2283,'Row_number','row-number','',80,7,1,'topic'),(2284,'Views','views','',81,7,1,'milestone'),(2285,'Creating Views','creating-views','',82,7,1,'topic'),(2286,'Modifying Views','modifying-views','',83,7,1,'topic'),(2287,'Dropping Views','dropping-views','',84,7,1,'topic'),(2288,'Indexes','indexes','',85,7,1,'milestone'),(2289,'Managing Indexes','managing-indexes','',86,7,1,'topic'),(2290,'Query Optimization','query-optimization','',87,7,1,'topic'),(2291,'Stored Procedures & Functions','stored-procedures-functions','',88,7,1,'milestone'),(2292,'Creating Procedures','creating-procedures','',89,7,1,'topic'),(2293,'Parameters','parameters','',90,7,1,'topic'),(2294,'Transactions','transactions','',91,7,1,'milestone'),(2295,'BEGIN','begin','',92,7,1,'topic'),(2296,'COMMIT','commit','',93,7,1,'topic'),(2297,'ROLLBACK','rollback','',94,7,1,'topic'),(2298,'SAVEPOINT','savepoint','',95,7,1,'topic'),(2299,'ACID','acid','',96,7,1,'topic'),(2300,'Transaction Isolation Levels','transaction-isolation-levels','',97,7,1,'topic'),(2301,'Data Integrity & Security','data-integrity-security','',98,7,1,'milestone'),(2302,'Data Integrity Constraints','data-integrity-constraints','',99,7,1,'topic'),(2303,'GRANT and Revoke','grant-and-revoke','',100,7,1,'topic'),(2304,'DB Security Best Practices','db-security-best-practices','',101,7,1,'topic'),(2305,'Performance Optimization','performance-optimization','',102,7,1,'milestone'),(2306,'Query Analysis Techniques','query-analysis-techniques','',103,7,1,'topic'),(2307,'Using Indexes','using-indexes','',104,7,1,'topic'),(2308,'Optimizing Joins','optimizing-joins','',105,7,1,'topic'),(2309,'Reducing Subqueries','reducing-subqueries','',106,7,1,'topic'),(2310,'Selective Projection','selective-projection','',107,7,1,'topic'),(2311,'Query Optimization Techniques','query-optimization-techniques','',108,7,1,'topic'),(2312,'Advanced SQL','advanced-sql','',109,7,1,'milestone'),(2313,'Recursive Queries','recursive-queries','',110,7,1,'topic'),(2314,'Pivot / Unpivot Operations','pivot-unpivot-operations','',111,7,1,'topic'),(2315,'Common Table Expressions','common-table-expressions','',112,7,1,'topic'),(2316,'Dynamic SQL','dynamic-sql','',113,7,1,'topic'),(2317,'Introduction','introduction','',0,8,1,'milestone'),(2318,'What is System Design?','what-is-system-design','',1,8,1,'topic'),(2319,'How to approach System Design?','how-to-approach-system-design','',2,8,1,'topic'),(2320,'CAP Theorem','cap-theorem','',3,8,1,'milestone'),(2321,'CP - Consistency + Partition Tolerance','cp-consistency-partition-tolerance','',4,8,1,'topic'),(2322,'AP - Availability + Partition Tolerance','ap-availability-partition-tolerance','',5,8,1,'topic'),(2323,'Performance vs Scalability','performance-vs-scalability','',6,8,1,'milestone'),(2324,'Latency vs Throughput','latency-vs-throughput','',7,8,1,'topic'),(2325,'Availability vs Consistency','availability-vs-consistency','',8,8,1,'milestone'),(2326,'Consistency Patterns','consistency-patterns','',9,8,1,'topic'),(2327,'Weak Consistency','weak-consistency','',10,8,1,'topic'),(2328,'Eventual Consistency','eventual-consistency','',11,8,1,'topic'),(2329,'Strong Consistency','strong-consistency','',12,8,1,'topic'),(2330,'Availability Patterns','availability-patterns','',13,8,1,'milestone'),(2331,'Fail-Over','fail-over','',14,8,1,'topic'),(2332,'Active - Active','active-active','',15,8,1,'topic'),(2333,'Active - Passive','active-passive','',16,8,1,'topic'),(2334,'Replication','replication','',17,8,1,'topic'),(2335,'Master - Slave','master-slave','',18,8,1,'topic'),(2336,'Master - Master','master-master','',19,8,1,'topic'),(2337,'Availability in Numbers','availability-in-numbers','',20,8,1,'milestone'),(2338,'99.9% Availability - three 9s','99-9-availability-three-9s','',21,8,1,'topic'),(2339,'99.99% Availability - four 9s','99-99-availability-four-9s','',22,8,1,'topic'),(2340,'Availability in Parallel vs Sequence','availability-in-parallel-vs-sequence','',23,8,1,'topic'),(2341,'Domain Name System','domain-name-system','',24,8,1,'milestone'),(2342,'DNS Basics','dns-basics','',25,8,1,'topic'),(2343,'Content Delivery Networks','content-delivery-networks','',26,8,1,'milestone'),(2344,'Push CDNs','push-cdns','',27,8,1,'topic'),(2345,'Pull CDNs','pull-cdns','',28,8,1,'topic'),(2346,'Load Balancers','load-balancers','',29,8,1,'milestone'),(2347,'Layer 4 Load Balancing','layer-4-load-balancing','',30,8,1,'topic'),(2348,'Layer 7 Load Balancing','layer-7-load-balancing','',31,8,1,'topic'),(2349,'LB vs Reverse Proxy','lb-vs-reverse-proxy','',32,8,1,'topic'),(2350,'Load Balancing Algorithms','load-balancing-algorithms','',33,8,1,'topic'),(2351,'Horizontal Scaling','horizontal-scaling','',34,8,1,'topic'),(2352,'Application Layer','application-layer','',35,8,1,'milestone'),(2353,'Microservices','microservices','',36,8,1,'topic'),(2354,'Service Discovery','service-discovery','',37,8,1,'topic'),(2355,'Databases','databases','',38,8,1,'milestone'),(2356,'RDBMS','rdbms','',39,8,1,'topic'),(2357,'NoSQL','nosql','',40,8,1,'topic'),(2358,'SQL vs NoSQL','sql-vs-nosql','',41,8,1,'topic'),(2359,'NoSQL','nosql-2','',42,8,1,'milestone'),(2360,'Key-Value Store','key-value-store','',43,8,1,'topic'),(2361,'Document Store','document-store','',44,8,1,'topic'),(2362,'Wide Column Store','wide-column-store','',45,8,1,'topic'),(2363,'Graph Databases','graph-databases','',46,8,1,'topic'),(2364,'Database Scaling','database-scaling','',47,8,1,'milestone'),(2365,'Replication','database-scaling-replication','',48,8,1,'topic'),(2366,'Sharding','sharding','',49,8,1,'topic'),(2367,'Federation','federation','',50,8,1,'topic'),(2368,'Denormalization','denormalization','',51,8,1,'topic'),(2369,'SQL Tuning','sql-tuning','',52,8,1,'topic'),(2370,'Caching','caching','',53,8,1,'milestone'),(2371,'Types of Caching','types-of-caching','',54,8,1,'topic'),(2372,'Client Caching','client-caching','',55,8,1,'topic'),(2373,'CDN Caching','cdn-caching','',56,8,1,'topic'),(2374,'Web Server Caching','web-server-caching','',57,8,1,'topic'),(2375,'Database Caching','database-caching','',58,8,1,'topic'),(2376,'Application Caching','application-caching','',59,8,1,'topic'),(2377,'Caching Strategies','caching-strategies','',60,8,1,'milestone'),(2378,'Cache Aside','cache-aside','',61,8,1,'topic'),(2379,'Write-through','write-through','',62,8,1,'topic'),(2380,'Write-behind','write-behind','',63,8,1,'topic'),(2381,'Refresh Ahead','refresh-ahead','',64,8,1,'topic'),(2382,'Asynchronism','asynchronism','',65,8,1,'milestone'),(2383,'Message Queues','message-queues','',66,8,1,'topic'),(2384,'Task Queues','task-queues','',67,8,1,'topic'),(2385,'Back Pressure','back-pressure','',68,8,1,'topic'),(2386,'Background Jobs','background-jobs','',69,8,1,'milestone'),(2387,'Event-Driven','event-driven','',70,8,1,'topic'),(2388,'Schedule Driven','schedule-driven','',71,8,1,'topic'),(2389,'Communication','communication','',72,8,1,'milestone'),(2390,'HTTP','http','',73,8,1,'topic'),(2391,'TCP','tcp','',74,8,1,'topic'),(2392,'UDP','udp','',75,8,1,'topic'),(2393,'REST','rest','',76,8,1,'topic'),(2394,'RPC','rpc','',77,8,1,'topic'),(2395,'gRPC','grpc','',78,8,1,'topic'),(2396,'GraphQL','graphql','',79,8,1,'topic'),(2397,'Idempotent Operations','idempotent-operations','',80,8,1,'milestone'),(2398,'Returning Results','returning-results','',81,8,1,'topic'),(2399,'Performance Antipatterns','performance-antipatterns','',82,8,1,'milestone'),(2400,'Busy Database','busy-database','',83,8,1,'topic'),(2401,'Busy Frontend','busy-frontend','',84,8,1,'topic'),(2402,'Chatty I/O','chatty-i-o','',85,8,1,'topic'),(2403,'Synchronous I/O','synchronous-i-o','',86,8,1,'topic'),(2404,'Extraneous Fetching','extraneous-fetching','',87,8,1,'topic'),(2405,'Improper Instantiation','improper-instantiation','',88,8,1,'topic'),(2406,'Monolithic Persistence','monolithic-persistence','',89,8,1,'topic'),(2407,'Noisy Neighbor','noisy-neighbor','',90,8,1,'topic'),(2408,'No Caching','no-caching','',91,8,1,'topic'),(2409,'Retry Storm','retry-storm','',92,8,1,'topic'),(2410,'Monitoring','monitoring','',93,8,1,'milestone'),(2411,'Health Monitoring','health-monitoring','',94,8,1,'topic'),(2412,'Availability Monitoring','availability-monitoring','',95,8,1,'topic'),(2413,'Performance Monitoring','performance-monitoring','',96,8,1,'topic'),(2414,'Security Monitoring','security-monitoring','',97,8,1,'topic'),(2415,'Usage Monitoring','usage-monitoring','',98,8,1,'topic'),(2416,'Instrumentation','instrumentation','',99,8,1,'topic'),(2417,'Visualization & Alerts','visualization-alerts','',100,8,1,'topic'),(2418,'Cloud Design Patterns','cloud-design-patterns','',101,8,1,'milestone'),(2419,'Ambassador','ambassador','',102,8,1,'topic'),(2420,'Anti-Corruption Layer','anti-corruption-layer','',103,8,1,'topic'),(2421,'Backends for Frontend','backends-for-frontend','',104,8,1,'topic'),(2422,'CQRS','cqrs','',105,8,1,'topic'),(2423,'Compute Resource Consolidation','compute-resource-consolidation','',106,8,1,'topic'),(2424,'External Config Store','external-config-store','',107,8,1,'topic'),(2425,'Gateway Aggregation','gateway-aggregation','',108,8,1,'topic'),(2426,'Gateway Offloading','gateway-offloading','',109,8,1,'topic'),(2427,'Gateway Routing','gateway-routing','',110,8,1,'topic'),(2428,'Leader Election','leader-election','',111,8,1,'topic'),(2429,'Pipes & Filters','pipes-filters','',112,8,1,'topic'),(2430,'Sidecar','sidecar','',113,8,1,'topic'),(2431,'Static Content Hosting','static-content-hosting','',114,8,1,'topic'),(2432,'Strangler Fig','strangler-fig','',115,8,1,'topic'),(2433,'Valet Key','valet-key','',116,8,1,'topic'),(2434,'Sequential Convoy','sequential-convoy','',117,8,1,'topic'),(2435,'Data Management Patterns','data-management-patterns','',118,8,1,'milestone'),(2436,'Cache-Aside','data-management-patterns-cache-aside','',119,8,1,'topic'),(2437,'CQRS','data-management-patterns-cqrs','',120,8,1,'topic'),(2438,'Event Sourcing','event-sourcing','',121,8,1,'topic'),(2439,'Index Table','index-table','',122,8,1,'topic'),(2440,'Materialized View','materialized-view','',123,8,1,'topic'),(2441,'Sharding','data-management-patterns-sharding','',124,8,1,'topic'),(2442,'Messaging Patterns','messaging-patterns','',125,8,1,'milestone'),(2443,'Async Request Reply','async-request-reply','',126,8,1,'topic'),(2444,'Claim Check','claim-check','',127,8,1,'topic'),(2445,'Choreography','choreography','',128,8,1,'topic'),(2446,'Competing Consumers','competing-consumers','',129,8,1,'topic'),(2447,'Pipes and Filters','pipes-and-filters','',130,8,1,'topic'),(2448,'Priority Queue','priority-queue','',131,8,1,'topic'),(2449,'Publisher/Subscriber','publisher-subscriber','',132,8,1,'topic'),(2450,'Queue-Based Load Leveling','queue-based-load-leveling','',133,8,1,'topic'),(2451,'Reliability Patterns','reliability-patterns','',134,8,1,'milestone'),(2452,'Availability','availability','',135,8,1,'topic'),(2453,'High Availability','high-availability','',136,8,1,'topic'),(2454,'Resiliency','resiliency','',137,8,1,'topic'),(2455,'Bulkhead','bulkhead','',138,8,1,'topic'),(2456,'Circuit Breaker','circuit-breaker','',139,8,1,'topic'),(2457,'Compensating Transaction','compensating-transaction','',140,8,1,'topic'),(2458,'Health Endpoint Monitoring','health-endpoint-monitoring','',141,8,1,'topic'),(2459,'Deployment Stamps','deployment-stamps','',142,8,1,'topic'),(2460,'Geodes','geodes','',143,8,1,'topic'),(2461,'Throttling','throttling','',144,8,1,'topic'),(2462,'Retry','retry','',145,8,1,'topic'),(2463,'Scheduler Agent Supervisor','scheduler-agent-supervisor','',146,8,1,'topic'),(2464,'Security Patterns','security-patterns','',147,8,1,'milestone'),(2465,'Federated Identity','federated-identity','',148,8,1,'topic'),(2466,'Gatekeeper','gatekeeper','',149,8,1,'topic'),(2467,'Valet Key','security-patterns-valet-key','',150,8,1,'topic'),(2656,'HTML, CSS, and DOM','frontend-basics','Master semantic HTML, Flexbox, Grid, and vanilla DOM manipulation.',1,37,NULL,'topic'),(2657,'JavaScript Deep Dive','js-deep-dive','Closures, Prototypes, Promises, Async/Await, and ES6+ features.',2,37,NULL,'milestone'),(2658,'Modern Frontend Frameworks','frontend-frameworks','Learn React, Vue, or Angular, including state management and routing.',3,37,NULL,'topic'),(2659,'Node.js & Express API','backend-node-express','Build RESTful APIs, handle middleware, and manage the event loop.',4,37,NULL,'milestone'),(2660,'Database Architecture','db-architecture','Design schemas in PostgreSQL, manage migrations, and use an ORM like Prisma.',5,37,NULL,'topic'),(2661,'DevOps & Deployment','devops-deployment','Docker containers, CI/CD pipelines with GitHub Actions, and hosting.',6,37,NULL,'optional'),(2712,'Foundational Knowledge','foundational-knowledge','',0,39,3,'milestone'),(2713,'Introduction to Game Development','introduction-to-game-development','',1,39,3,'topic'),(2714,'Game Engines (Unity, Unreal Engine)','game-engines-unity-unreal-engine','',2,39,3,'topic'),(2715,'Programming Paradigms (C#, Java, C++)','programming-paradigms-c-java-c','',3,39,3,'topic'),(2716,'Game Art and Design','game-art-and-design','',4,39,3,'milestone'),(2717,'Game Art Principles (Color Theory, Texture Mapping)','game-art-principles-color-theory-texture-mapping','',5,39,3,'topic'),(2718,'Game Design Fundamentals (Storytelling, Level Design)','game-design-fundamentals-storytelling-level-design','',6,39,3,'topic'),(2719,'Visual Design Tools (Adobe Creative Suite, Blender)','visual-design-tools-adobe-creative-suite-blender','',7,39,3,'topic'),(2720,'Game Programming','game-programming','',8,39,3,'milestone'),(2721,'Game Loop and Event Handling','game-loop-and-event-handling','',9,39,3,'topic'),(2722,'Collision Detection and Response','collision-detection-and-response','',10,39,3,'topic'),(2723,'Game AI and Pathfinding','game-ai-and-pathfinding','',11,39,3,'topic'),(2724,'Game Physics and Math','game-physics-and-math','',12,39,3,'milestone'),(2725,'Vector Math and 3D Transformations','vector-math-and-3d-transformations','',13,39,3,'topic'),(2726,'Physics Engines (Rigidbody, Collision)','physics-engines-rigidbody-collision','',14,39,3,'topic'),(2727,'Math for Game Development (Algebra, Geometry)','math-for-game-development-algebra-geometry','',15,39,3,'topic'),(2728,'Game Audio and Sound Design','game-audio-and-sound-design','',16,39,3,'milestone'),(2729,'Audio Fundamentals (WAV, MP3, MIDI)','audio-fundamentals-wav-mp3-midi','',17,39,3,'topic'),(2730,'Sound Design Principles (Sound Effects, Music Composition)','sound-design-principles-sound-effects-music-composition','',18,39,3,'topic'),(2731,'Audio Implementation (FMOD, Wwise)','audio-implementation-fmod-wwise','',19,39,3,'topic'),(2732,'Game Testing and Quality Assurance','game-testing-and-quality-assurance','',20,39,3,'milestone'),(2733,'Testing Principles and Best Practices','testing-principles-and-best-practices','',21,39,3,'topic'),(2734,'Automated Testing (Jest, Pytest)','automated-testing-jest-pytest','',22,39,3,'topic'),(2735,'Game Balancing and Tuning','game-balancing-and-tuning','',23,39,3,'topic'),(2736,'Game Deployment and Operations','game-deployment-and-operations','',24,39,3,'milestone'),(2737,'Game Build and Deployment (CI/CD Pipelines)','game-build-and-deployment-cicd-pipelines','',25,39,3,'topic'),(2738,'Game Server and Client-Side Optimization','game-server-and-client-side-optimization','',26,39,3,'topic'),(2739,'Game Analytics and Performance Monitoring','game-analytics-and-performance-monitoring','',27,39,3,'topic'),(2740,'Advanced Topics in Game Development','advanced-topics-in-game-development','',28,39,3,'milestone'),(2741,'Machine Learning for Games (AI, Recommendation Systems)','machine-learning-for-games-ai-recommendation-systems','',29,39,3,'topic'),(2742,'Virtual Reality (VR) and Augmented Reality (AR)','virtual-reality-vr-and-augmented-reality-ar','',30,39,3,'topic'),(2743,'Cloud Gaming and Game Streaming','cloud-gaming-and-game-streaming','',31,39,3,'topic'),(2744,'Game Development Best Practices and Tools','game-development-best-practices-and-tools','',32,39,3,'milestone'),(2745,'Code Review and Code Quality','code-review-and-code-quality','',33,39,3,'topic'),(2746,'Version Control Systems (Git, SVN)','version-control-systems-git-svn','',34,39,3,'topic'),(2747,'Agile Methodologies and Project Management','agile-methodologies-and-project-management','',35,39,3,'topic');
/*!40000 ALTER TABLE `core_topic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topic_dependencies`
--

DROP TABLE IF EXISTS `core_topic_dependencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topic_dependencies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `from_topic_id` bigint NOT NULL,
  `to_topic_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_topic_dependencies_from_topic_id_to_topic_id_7a0b5569_uniq` (`from_topic_id`,`to_topic_id`),
  KEY `core_topic_dependencies_to_topic_id_42583335_fk_core_topic_id` (`to_topic_id`),
  CONSTRAINT `core_topic_dependencies_from_topic_id_17928311_fk_core_topic_id` FOREIGN KEY (`from_topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topic_dependencies_to_topic_id_42583335_fk_core_topic_id` FOREIGN KEY (`to_topic_id`) REFERENCES `core_topic` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=316 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topic_dependencies`
--

LOCK TABLES `core_topic_dependencies` WRITE;
/*!40000 ALTER TABLE `core_topic_dependencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_topic_dependencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topicfeynman`
--

DROP TABLE IF EXISTS `core_topicfeynman`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topicfeynman` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `concept` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `explanation` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `feedback` longtext COLLATE utf8mb4_unicode_ci,
  `score` int NOT NULL,
  `is_self_graded` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_topicfeynman_topic_id_f3e8c1e0_fk_core_topic_id` (`topic_id`),
  KEY `core_topicfeynman_user_id_9b11723e_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_topicfeynman_topic_id_f3e8c1e0_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topicfeynman_user_id_9b11723e_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topicfeynman`
--

LOCK TABLES `core_topicfeynman` WRITE;
/*!40000 ALTER TABLE `core_topicfeynman` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_topicfeynman` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topicflashcard`
--

DROP TABLE IF EXISTS `core_topicflashcard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topicflashcard` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cards` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_topicflashcard_user_id_topic_id_305dc1ca_uniq` (`user_id`,`topic_id`),
  KEY `core_topicflashcard_topic_id_94a53b3b_fk_core_topic_id` (`topic_id`),
  CONSTRAINT `core_topicflashcard_topic_id_94a53b3b_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topicflashcard_user_id_549d42c3_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topicflashcard`
--

LOCK TABLES `core_topicflashcard` WRITE;
/*!40000 ALTER TABLE `core_topicflashcard` DISABLE KEYS */;
INSERT INTO `core_topicflashcard` VALUES (4,'[{\"back\": \"Application programming Interface \", \"front\": \"API \"}]','2026-06-17 14:42:48.757642',1711,3),(5,'[{\"back\": \"Backside Oi \", \"ease\": 2.5, \"front\": \"Oiii \", \"interval\": 0, \"next_review\": null, \"repetitions\": 0}, {\"back\": \"backside two oi oi \", \"ease\": 2.5, \"front\": \"Oii oii\", \"interval\": 1, \"next_review\": \"2026-06-22T14:16:34.890Z\", \"repetitions\": 1}]','2026-06-18 14:45:18.781777',1710,3),(7,'[{\"back\": \"jwt token pased \", \"ease\": 2.35, \"front\": \"auth \", \"interval\": 1440, \"next_review\": \"2026-06-22T14:17:44.116Z\", \"repetitions\": 1}, {\"back\": \"functinalk testignm , unit testingrtc etc dt c\", \"ease\": 2.5, \"front\": \"api testing \", \"interval\": 4320, \"next_review\": \"2026-06-24T14:20:38.950Z\", \"repetitions\": 1}]','2026-06-18 17:48:46.480062',1713,3);
/*!40000 ALTER TABLE `core_topicflashcard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topicmaterial`
--

DROP TABLE IF EXISTS `core_topicmaterial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topicmaterial` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `ai_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ai_feedback` longtext COLLATE utf8mb4_unicode_ci,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `ai_score` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_topicmaterial_topic_id_c6829df4_fk_core_topic_id` (`topic_id`),
  KEY `core_topicmaterial_user_id_5a4c2e15_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_topicmaterial_topic_id_c6829df4_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topicmaterial_user_id_5a4c2e15_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topicmaterial`
--

LOCK TABLES `core_topicmaterial` WRITE;
/*!40000 ALTER TABLE `core_topicmaterial` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_topicmaterial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topicnote`
--

DROP TABLE IF EXISTS `core_topicnote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topicnote` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_topicnote_user_id_topic_id_e593a064_uniq` (`user_id`,`topic_id`),
  KEY `core_topicnote_topic_id_92d692d0_fk_core_topic_id` (`topic_id`),
  CONSTRAINT `core_topicnote_topic_id_92d692d0_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topicnote_user_id_c1a066de_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topicnote`
--

LOCK TABLES `core_topicnote` WRITE;
/*!40000 ALTER TABLE `core_topicnote` DISABLE KEYS */;
INSERT INTO `core_topicnote` VALUES (37,'','2026-06-16 14:19:47.069218',1724,3),(38,'','2026-06-16 14:35:42.981567',1852,3),(40,'','2026-06-17 14:22:41.466575',1709,3),(41,'','2026-06-17 14:22:50.419020',1624,3),(42,'Achhaaa\nTesting it out again buddy \nhmm ok ok \noi oi oi \nyoo man','2026-06-18 16:47:01.669350',1710,3),(43,'','2026-06-17 14:33:48.492080',1625,3),(44,'','2026-06-17 14:42:29.793929',1711,3),(45,'','2026-06-17 14:46:29.703420',1712,3),(47,'','2026-06-17 16:39:34.741993',1888,3),(50,'','2026-06-17 17:05:54.365755',1495,3),(51,'','2026-06-17 17:16:04.086257',1501,3),(52,'','2026-06-17 17:18:53.282020',1496,3),(53,'','2026-06-17 17:19:08.122879',1497,3),(54,'','2026-06-17 17:19:15.511752',1498,3),(56,'','2026-06-18 14:11:19.025163',1710,5),(63,'JWT OVER \nAUTH SESSION COMPLETED','2026-06-21 15:36:32.844441',1713,3),(64,'','2026-06-20 17:31:04.425658',1714,3),(65,'','2026-06-20 17:31:11.970629',1715,3);
/*!40000 ALTER TABLE `core_topicnote` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topicprogress`
--

DROP TABLE IF EXISTS `core_topicprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topicprogress` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_topicprogress_topic_id_b964759f_fk_core_topic_id` (`topic_id`),
  KEY `core_topicprogress_user_id_352fdceb_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_topicprogress_topic_id_b964759f_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topicprogress_user_id_352fdceb_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topicprogress`
--

LOCK TABLES `core_topicprogress` WRITE;
/*!40000 ALTER TABLE `core_topicprogress` DISABLE KEYS */;
INSERT INTO `core_topicprogress` VALUES (37,'locked',NULL,NULL,1724,3),(38,'locked',NULL,NULL,1852,3),(40,'in_progress','2026-06-17 14:44:48.078179',NULL,1709,3),(41,'completed','2026-06-17 14:35:06.527441',NULL,1624,3),(42,'completed','2026-06-17 14:47:39.680642',NULL,1710,3),(43,'completed','2026-06-17 14:33:48.453326',NULL,1625,3),(44,'completed','2026-06-17 14:42:29.765056',NULL,1711,3),(45,'completed','2026-06-17 14:46:29.680722',NULL,1712,3),(47,'in_progress','2026-06-17 16:39:34.719864',NULL,1888,3),(50,'in_progress','2026-06-17 17:05:54.345201',NULL,1495,3),(51,'in_progress','2026-06-17 17:16:00.470106',NULL,1501,3),(52,'completed','2026-06-17 17:18:53.263855',NULL,1496,3),(53,'completed','2026-06-17 17:19:08.103312',NULL,1497,3),(54,'in_progress','2026-06-17 17:19:15.482821',NULL,1498,3),(56,'in_progress','2026-06-18 14:09:07.290973',NULL,1710,5),(63,'completed','2026-06-18 17:46:51.641426',NULL,1713,3),(64,'completed','2026-06-18 17:59:57.078010',NULL,1714,3),(65,'completed','2026-06-20 17:31:00.887485',NULL,1715,3);
/*!40000 ALTER TABLE `core_topicprogress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topicquiz`
--

DROP TABLE IF EXISTS `core_topicquiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topicquiz` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `difficulty` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `questions` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_topicquiz_user_id_topic_id_difficulty_4468c6c0_uniq` (`user_id`,`topic_id`,`difficulty`),
  KEY `core_topicquiz_topic_id_557a669c_fk_core_topic_id` (`topic_id`),
  CONSTRAINT `core_topicquiz_topic_id_557a669c_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topicquiz_user_id_6107b253_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topicquiz`
--

LOCK TABLES `core_topicquiz` WRITE;
/*!40000 ALTER TABLE `core_topicquiz` DISABLE KEYS */;
INSERT INTO `core_topicquiz` VALUES (4,'medium','[{\"answer\": \"HyperText Transfer Protocol\", \"options\": [\"HyperText Transfer Protocol\", \"HyperText Transfer System\", \"HyperText Transfer Service\", \"HyperText Transfer Language\"], \"question\": \"What does HTTP stand for?\"}, {\"answer\": \"To transfer data between client and server\", \"options\": [\"To manage database queries\", \"To handle user authentication\", \"To transfer data between client and server\", \"To render web pages\"], \"question\": \"What is the primary function of HTTP in web communication?\"}, {\"answer\": \"HTTP/1.1 supports persistent connections\", \"options\": [\"HTTP/1.0 supports only GET and POST methods\", \"HTTP/1.1 supports persistent connections\", \"HTTP/1.0 is more secure than HTTP/1.1\", \"HTTP/1.0 is faster than HTTP/1.1\"], \"question\": \"What is the main difference between HTTP/1.0 and HTTP/1.1?\"}, {\"answer\": \"The requested resource is not found\", \"options\": [\"The requested resource is not found\", \"The requested resource is temporarily unavailable\", \"The requested resource is permanently moved\", \"The requested resource is forbidden\"], \"question\": \"What is the purpose of the HTTP status code 404?\"}, {\"answer\": \"GET is used for retrieving resources, while POST is used for updating resources\", \"options\": [\"GET is used for updating resources, while POST is used for retrieving resources\", \"GET is used for retrieving resources, while POST is used for updating resources\", \"GET is used for creating resources, while POST is used for deleting resources\", \"GET is used for deleting resources, while POST is used for creating resources\"], \"question\": \"What is the difference between HTTP request methods GET and POST?\"}]','2026-06-17 14:42:32.972852',1711,3),(5,'medium','[{\"answer\": \"To generate human-like text based on input prompts\", \"options\": [\"To translate languages in real-time\", \"To generate human-like text based on input prompts\", \"To perform complex mathematical calculations\", \"To play chess at a grandmaster level\"], \"question\": \"What is the primary function of a Large Language Model (LLM)?\"}, {\"answer\": \"Transfer learning\", \"options\": [\"Data augmentation\", \"Knowledge distillation\", \"Transfer learning\", \"Generative adversarial training\"], \"question\": \"What is a common technique used to fine-tune a pre-trained LLM?\"}, {\"answer\": \"It may struggle with nuanced or abstract concepts\", \"options\": [\"It may produce overly formal language\", \"It may struggle with nuanced or abstract concepts\", \"It may be too slow for real-time applications\", \"It may not be able to learn from new data\"], \"question\": \"What is a potential drawback of using an LLM for tasks that require common sense?\"}, {\"answer\": \"Automated customer service chatbots\", \"options\": [\"Real-time language translation for emergency services\", \"Automated customer service chatbots\", \"Personalized news article summarization\", \"Medical diagnosis and treatment planning\"], \"question\": \"What is an example of an application where an LLM can be used to assist humans?\"}, {\"answer\": \"All of the above\", \"options\": [\"Data breaches due to inadequate security measures\", \"Biased output due to discriminatory training data\", \"Over-reliance on technology leading to human skill degradation\", \"All of the above\"], \"question\": \"What is a potential risk associated with the use of LLMs in sensitive domains?\"}]','2026-06-17 17:16:06.080002',1501,3),(6,'medium','[{\"answer\": \"To engage the reader\'s attention and interest\", \"options\": [\"To provide background information on the topic\", \"To present the main argument or thesis statement\", \"To engage the reader\'s attention and interest\", \"To summarize the entire work\"], \"question\": \"What is the primary purpose of an introduction in a written work?\"}, {\"answer\": \"Start with a broad statement and narrow down to a specific topic\", \"options\": [\"Start with a broad statement and narrow down to a specific topic\", \"Begin with a personal anecdote and transition to the main topic\", \"Use a formal tone and avoid any personal opinions\", \"Start with a question and provide a brief answer\"], \"question\": \"How should an introduction be structured to effectively set the tone for the rest of the work?\"}]','2026-06-18 15:25:30.556008',2317,1),(7,'medium','[{\"answer\": \"To direct data packets between networks\", \"options\": [\"To connect multiple devices to the internet\", \"To direct data packets between networks\", \"To provide internet access to devices\", \"To store and manage data\"], \"question\": \"What is the primary function of a router in a network?\"}, {\"answer\": \"To identify devices on a network\", \"options\": [\"To identify devices on a network\", \"To encrypt data being transmitted\", \"To provide internet access to devices\", \"To manage network traffic\"], \"question\": \"What is the purpose of IP addresses in the internet?\"}, {\"answer\": \"HTTP is used for web browsing, while HTTPS is used for secure connections\", \"options\": [\"HTTP is used for secure connections, while HTTPS is used for insecure connections\", \"HTTP is used for web browsing, while HTTPS is used for email\", \"HTTP is used for web browsing, while HTTPS is used for secure connections\", \"HTTP is used for email, while HTTPS is used for web browsing\"], \"question\": \"What is the difference between HTTP and HTTPS?\"}, {\"answer\": \"To translate domain names to IP addresses\", \"options\": [\"To translate IP addresses to domain names\", \"To translate domain names to IP addresses\", \"To provide internet access to devices\", \"To manage network traffic\"], \"question\": \"What is the purpose of DNS (Domain Name System) in the internet?\"}, {\"answer\": \"Breaking down data into small packets and reassembling them at the destination\", \"options\": [\"Breaking down data into small packets and reassembling them at the destination\", \"Encrypting data before transmission\", \"Providing internet access to devices\", \"Managing network traffic\"], \"question\": \"What is the concept of packet switching in the internet?\"}]','2026-06-18 15:26:07.763803',1710,3),(8,'hard','[{\"answer\": \"To translate human-readable domain names into IP addresses\", \"options\": [\"To cache frequently accessed web pages\", \"To translate human-readable domain names into IP addresses\", \"To manage network congestion and packet loss\", \"To authenticate user credentials for secure connections\"], \"question\": \"What is the primary function of a DNS (Domain Name System) server in the internet infrastructure?\"}, {\"answer\": \"The NAT router\'s IP address is not publicly routable\", \"options\": [\"The NAT router\'s firewall blocks incoming connections\", \"The NAT router\'s IP address is not publicly routable\", \"The user\'s internet connection speed is too slow for peer-to-peer connections\", \"The user\'s device is not capable of handling peer-to-peer connections\"], \"question\": \"In a scenario where a user\'s internet connection is behind a NAT (Network Address Translation) router, what is the primary limitation of their ability to establish peer-to-peer connections?\"}, {\"answer\": \"TLS (Transport Layer Security)\", \"options\": [\"TLS (Transport Layer Security)\", \"SSL (Secure Sockets Layer)\", \"HTTP (Hypertext Transfer Protocol)\", \"IPSec (Internet Protocol Security)\"], \"question\": \"What is the name of the protocol used for secure communication between a web browser and a web server, which ensures the confidentiality and integrity of data transmitted between them?\"}, {\"answer\": \"DiffServ (Differentiated Services)\", \"options\": [\"Traffic shaping\", \"Traffic policing\", \"Class of Service (CoS)\", \"DiffServ (Differentiated Services)\"], \"question\": \"In a scenario where a network administrator wants to implement Quality of Service (QoS) to prioritize traffic for critical applications, what is the primary mechanism used to achieve this?\"}, {\"answer\": \"BGP (Border Gateway Protocol)\", \"options\": [\"BGP (Border Gateway Protocol)\", \"OSPF (Open Shortest Path First)\", \"RIP (Routing Information Protocol)\", \"IGMP (Internet Group Management Protocol)\"], \"question\": \"What is the name of the internet protocol used for routing packets between networks that do not share a common subnet mask, which relies on the longest prefix match to determine the best path?\"}]','2026-06-18 16:01:06.449216',1710,3),(10,'medium','[{\"answer\": \"A type of cloud computing that provides scalable infrastructure\", \"options\": [\"A process of managing and maintaining a website\", \"A service that allows users to access a remote computer\", \"A way to share files and folders with others\", \"A type of cloud computing that provides scalable infrastructure\"], \"question\": \"What is hosting?\"}, {\"answer\": \"To store and serve files to users over the internet\", \"options\": [\"To provide a platform for users to create and manage their own websites\", \"To offer a range of services including domain registration and email hosting\", \"To store and serve files to users over the internet\", \"To provide a secure and reliable platform for e-commerce applications\"], \"question\": \"What is the primary function of a web host?\"}, {\"answer\": \"All of the above\", \"options\": [\"Increased security and reliability\", \"Improved performance and scalability\", \"Reduced costs and increased flexibility\", \"All of the above\"], \"question\": \"What are the benefits of using a cloud hosting service?\"}, {\"answer\": \"Dedicated hosting is a type of hosting where a single user has an entire server\", \"options\": [\"Shared hosting is more expensive than dedicated hosting\", \"Dedicated hosting is more scalable than shared hosting\", \"Shared hosting is a type of hosting where multiple users share a single server\", \"Dedicated hosting is a type of hosting where a single user has an entire server\"], \"question\": \"What is the difference between shared hosting and dedicated hosting?\"}, {\"answer\": \"A type of hosting where a user has a virtualized server with dedicated resources\", \"options\": [\"A type of hosting where a single user has an entire server\", \"A type of hosting where multiple users share a single server\", \"A type of hosting where a user has a virtualized server with dedicated resources\", \"A type of hosting where a user has a shared server with limited resources\"], \"question\": \"What is virtual private server (VPS) hosting?\"}]','2026-06-18 17:49:43.638990',1713,3),(11,'hard','[{\"answer\": \"Hosting is a service that allows users to store and serve both static and dynamic content, and provides a server to handle requests.\", \"options\": [\"Hosting is a service that allows users to store and serve static files, but does not support dynamic content.\", \"Hosting is a service that allows users to store and serve dynamic content, but does not support static files.\", \"Hosting is a service that allows users to store and serve both static and dynamic content, and provides a server to handle requests.\", \"Hosting is a service that allows users to store and serve static files, and provides a server to handle requests.\"], \"question\": \"What is hosting in the context of web development, and how does it relate to the concept of \'server\'?\"}, {\"answer\": \"A hosting provider stores and serves content, while a CDN caches and distributes content.\", \"options\": [\"A hosting provider stores and serves content, while a CDN caches and distributes content.\", \"A hosting provider caches and distributes content, while a CDN stores and serves content.\", \"A hosting provider and a CDN are the same thing, and both store and serve content.\", \"A hosting provider stores and serves content, while a CDN provides a server to handle requests.\"], \"question\": \"What is the difference between a hosting provider and a Content Delivery Network (CDN)?\"}, {\"answer\": \"Managed hosting is a service that allows users to store and serve content, and provides support and maintenance, as well as allows users to customize their server.\", \"options\": [\"Managed hosting is a service that allows users to store and serve content, but does not provide any support or maintenance.\", \"Managed hosting is a service that allows users to store and serve content, and provides support and maintenance, but does not allow users to customize their server.\", \"Managed hosting is a service that allows users to store and serve content, and provides support and maintenance, as well as allows users to customize their server.\", \"Managed hosting is a service that allows users to store and serve content, and provides support and maintenance, but only for static files.\"], \"question\": \"What is the concept of \'managed hosting\' in the context of web development, and how does it differ from \'unmanaged hosting\'?\"}, {\"answer\": \"Shared hosting is a service that allows multiple users to store and serve content on the same server, while dedicated hosting is a service that allows a single user to store and serve content on their own server.\", \"options\": [\"Shared hosting is a service that allows multiple users to store and serve content on the same server, while dedicated hosting is a service that allows a single user to store and serve content on their own server.\", \"Shared hosting is a service that allows a single user to store and serve content on their own server, while dedicated hosting is a service that allows multiple users to store and serve content on the same server.\", \"Shared hosting is a service that allows multiple users to store and serve content on the same server, but does not provide any support or maintenance, while dedicated hosting is a service that allows a single user to store and serve content on their own server, and provides support and maintenance.\", \"Shared hosting is a service that allows multiple users to store and serve content on the same server, while dedicated hosting is a service that allows a single user to store and serve content on their own server, and provides a server to handle requests.\"], \"question\": \"What is the difference between \'shared hosting\' and \'dedicated hosting\' in the context of web development?\"}, {\"answer\": \"Cloud hosting is a service that allows users to store and serve content on a virtual server, and provides a server to handle requests, while traditional hosting is a service that allows users to store and serve content on a physical server.\", \"options\": [\"Cloud hosting is a service that allows users to store and serve content on a physical server, while traditional hosting is a service that allows users to store and serve content on a virtual server.\", \"Cloud hosting is a service that allows users to store and serve content on a virtual server, while traditional hosting is a service that allows users to store and serve content on a physical server.\", \"Cloud hosting is a service that allows users to store and serve content on a virtual server, and provides a server to handle requests, while traditional hosting is a service that allows users to store and serve content on a physical server.\", \"Cloud hosting is a service that allows users to store and serve content on a virtual server, and provides a server to handle requests, while traditional hosting is a service that allows users to store and serve content on a physical server, and provides support and maintenance.\"], \"question\": \"What is the concept of \'cloud hosting\' in the context of web development, and how does it differ from traditional hosting?\"}]','2026-06-18 17:49:47.077605',1713,3);
/*!40000 ALTER TABLE `core_topicquiz` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_topicscreenshot`
--

DROP TABLE IF EXISTS `core_topicscreenshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_topicscreenshot` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `core_topicscreenshot_topic_id_21185314_fk_core_topic_id` (`topic_id`),
  KEY `core_topicscreenshot_user_id_dc4ff815_fk_auth_user_id` (`user_id`),
  CONSTRAINT `core_topicscreenshot_topic_id_21185314_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_topicscreenshot_user_id_dc4ff815_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_topicscreenshot`
--

LOCK TABLES `core_topicscreenshot` WRITE;
/*!40000 ALTER TABLE `core_topicscreenshot` DISABLE KEYS */;
INSERT INTO `core_topicscreenshot` VALUES (83,'screenshots/image_f4O3zDi.png','','2026-06-17 16:46:06.783182',1710,3),(84,'screenshots/image_4E5MX1T.png','','2026-06-17 16:46:07.181524',1710,3),(85,'screenshots/image_zXvAbud.png','','2026-06-17 16:46:07.489176',1710,3),(86,'screenshots/image_Y7in7HF.png','','2026-06-17 16:46:07.753064',1710,3),(87,'screenshots/image_lyV7HRJ.png','','2026-06-17 16:46:08.051598',1710,3),(88,'screenshots/image_FBw2VCm.png','','2026-06-17 16:46:08.318370',1710,3),(97,'screenshots/image_IBVv5pb.png','','2026-06-18 17:47:23.344000',1713,3),(98,'screenshots/image_GDrqGb3.png','','2026-06-18 17:47:23.797397',1713,3),(99,'screenshots/image_PBorNpo.png','','2026-06-18 17:47:24.092363',1713,3),(100,'screenshots/image_4Oc2ADe.png','','2026-06-18 17:47:24.250033',1713,3),(101,'screenshots/image_KMwL81j.png','','2026-06-18 17:47:24.393044',1713,3),(102,'screenshots/image_uQd6LjT.png','','2026-06-18 17:47:24.520623',1713,3),(103,'screenshots/image_vDOtMSW.png','','2026-06-18 17:47:24.649509',1713,3),(104,'screenshots/image_GtiwnYD.png','','2026-06-18 17:47:24.830846',1713,3),(105,'screenshots/image_W0NSKt5.png','','2026-06-18 17:47:24.912008',1713,3),(106,'screenshots/image_9TNvzUG.png','','2026-06-18 17:47:25.037426',1713,3),(107,'screenshots/image_t3D1LMm.png','','2026-06-18 17:47:25.111459',1713,3);
/*!40000 ALTER TABLE `core_topicscreenshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_userprofile`
--

DROP TABLE IF EXISTS `core_userprofile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_userprofile` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `current_streak` int NOT NULL,
  `longest_streak` int NOT NULL,
  `selected_path_id` bigint DEFAULT NULL,
  `user_id` int NOT NULL,
  `github_username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `streak_revive_used_at` datetime(6) DEFAULT NULL,
  `selected_title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `github_access_token` longtext COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (_utf8mb4''),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `core_userprofile_selected_path_id_feaaf8cd_fk_core_lear` (`selected_path_id`),
  CONSTRAINT `core_userprofile_selected_path_id_feaaf8cd_fk_core_lear` FOREIGN KEY (`selected_path_id`) REFERENCES `core_learningpath` (`id`),
  CONSTRAINT `core_userprofile_user_id_5141ad90_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_userprofile`
--

LOCK TABLES `core_userprofile` WRITE;
/*!40000 ALTER TABLE `core_userprofile` DISABLE KEYS */;
INSERT INTO `core_userprofile` VALUES (1,0,0,NULL,1,'',NULL,'Novice',''),(2,0,0,NULL,2,'https://github.com/anxmeshhh',NULL,'Novice',''),(3,0,0,NULL,3,'animeshbro4',NULL,'Learner','gAAAAABqN-RyoIXqyzxV34Kd3R4IZ7xT7WR_vUllcWsGpw9FZ4TBQFjGwfNbvnI3R8OfuX6N1pYeKcwe0tNML_PDzKXrSFzA_2EPQaWaKU6kgYgdrbPRfYGYeEHzRc7kt8euHirOIy3m'),(4,0,0,NULL,4,'',NULL,'Novice',''),(5,0,0,NULL,5,'anxmeshhh',NULL,'Novice','gAAAAABqM_zUIBh6NazsDnI1MxVreaC2aesFd-0lLWp5OtjTSJFjRvK-YFpKgiSeL6M9qiQNj1BfAkTXVr9V3xQrBKNz_MPz_88zeTw7WoLUs91UnEYmYtvmBKxbWhhF_wTog88IzJN1'),(6,0,0,NULL,6,'',NULL,'Novice',''),(7,0,0,NULL,7,'',NULL,'Novice','');
/*!40000 ALTER TABLE `core_userprofile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `core_verifiedproject`
--

DROP TABLE IF EXISTS `core_verifiedproject`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `core_verifiedproject` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `repo_url` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `repo_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ai_evaluation` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `verified_at` datetime(6) NOT NULL,
  `topic_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `ai_score` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `core_verifiedproject_user_id_topic_id_b5b6d49c_uniq` (`user_id`,`topic_id`),
  KEY `core_verifiedproject_topic_id_143f2024_fk_core_topic_id` (`topic_id`),
  CONSTRAINT `core_verifiedproject_topic_id_143f2024_fk_core_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `core_topic` (`id`),
  CONSTRAINT `core_verifiedproject_user_id_c34f5c5c_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `core_verifiedproject`
--

LOCK TABLES `core_verifiedproject` WRITE;
/*!40000 ALTER TABLE `core_verifiedproject` DISABLE KEYS */;
/*!40000 ALTER TABLE `core_verifiedproject` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(23,'core','adminrequest'),(13,'core','bookmark'),(16,'core','chatmessage'),(11,'core','contribution'),(7,'core','learningpath'),(15,'core','notedocument'),(22,'core','otpverification'),(20,'core','pathsharing'),(8,'core','topic'),(24,'core','topicfeynman'),(18,'core','topicflashcard'),(12,'core','topicmaterial'),(14,'core','topicnote'),(10,'core','topicprogress'),(17,'core','topicquiz'),(21,'core','topicscreenshot'),(9,'core','userprofile'),(19,'core','verifiedproject'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-06-13 10:09:38.718435'),(2,'auth','0001_initial','2026-06-13 10:09:39.197033'),(3,'admin','0001_initial','2026-06-13 10:09:39.311347'),(4,'admin','0002_logentry_remove_auto_add','2026-06-13 10:09:39.317420'),(5,'admin','0003_logentry_add_action_flag_choices','2026-06-13 10:09:39.323697'),(6,'contenttypes','0002_remove_content_type_name','2026-06-13 10:09:39.423732'),(7,'auth','0002_alter_permission_name_max_length','2026-06-13 10:09:39.471935'),(8,'auth','0003_alter_user_email_max_length','2026-06-13 10:09:39.491254'),(9,'auth','0004_alter_user_username_opts','2026-06-13 10:09:39.497521'),(10,'auth','0005_alter_user_last_login_null','2026-06-13 10:09:39.567289'),(11,'auth','0006_require_contenttypes_0002','2026-06-13 10:09:39.569903'),(12,'auth','0007_alter_validators_add_error_messages','2026-06-13 10:09:39.575166'),(13,'auth','0008_alter_user_username_max_length','2026-06-13 10:09:39.622138'),(14,'auth','0009_alter_user_last_name_max_length','2026-06-13 10:09:39.671525'),(15,'auth','0010_alter_group_name_max_length','2026-06-13 10:09:39.684805'),(16,'auth','0011_update_proxy_permissions','2026-06-13 10:09:39.691547'),(17,'auth','0012_alter_user_first_name_max_length','2026-06-13 10:09:39.738851'),(18,'core','0001_initial','2026-06-13 10:09:40.105166'),(19,'core','0002_learningpath_created_by_learningpath_is_custom_and_more','2026-06-13 10:09:40.509397'),(20,'core','0003_topicnote','2026-06-13 10:09:40.642752'),(21,'core','0004_topic_dependencies','2026-06-13 10:09:40.756599'),(22,'core','0005_notedocument','2026-06-13 10:09:40.858047'),(23,'sessions','0001_initial','2026-06-13 10:09:40.884924'),(24,'core','0006_alter_contribution_options_remove_contribution_date_and_more','2026-06-13 11:44:50.772159'),(25,'core','0007_chatmessage','2026-06-13 12:14:42.079177'),(26,'core','0008_userprofile_github_username','2026-06-13 14:46:28.195156'),(27,'core','0009_topicquiz_topicflashcard','2026-06-13 15:36:28.082309'),(28,'core','0010_verifiedproject','2026-06-13 15:38:19.464119'),(29,'core','0011_alter_learningpath_options_learningpath_created_at_and_more','2026-06-15 09:49:55.434141'),(30,'core','0012_topicscreenshot','2026-06-16 00:09:47.711313'),(31,'core','0013_verifiedproject_ai_score','2026-06-16 00:29:20.455288'),(32,'core','0014_topicmaterial_ai_score','2026-06-16 00:33:26.709994'),(33,'core','0015_userprofile_streak_revive_used_at','2026-06-16 01:05:55.492680'),(34,'core','0016_topic_node_kind','2026-06-16 01:30:09.272888'),(35,'core','0017_cleanup_legacy_dependencies','2026-06-16 02:19:27.572402'),(36,'core','0018_userprofile_selected_title','2026-06-17 15:57:43.106312'),(37,'core','0019_otpverification','2026-06-18 12:31:04.661151'),(38,'core','0020_userprofile_github_access_token','2026-06-18 13:10:10.024335'),(39,'core','0021_learningpath_github_repo_name','2026-06-18 14:12:42.976701'),(40,'core','0022_expand_slug_lengths','2026-06-18 16:05:48.389542'),(41,'core','0023_adminrequest','2026-06-20 16:36:08.699246'),(42,'core','0024_topicfeynman','2026-06-21 13:57:57.481165');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('56o3qur1vujex28wnrrvod2ap15wie0v','.eJxVjEEOwiAQRe_C2hAGZmjr0r1nIANDbdVAUtqV8e7apAvd_vfef6nA2zqFreUlzKLOCtTpd4ucHrnsQO5cblWnWtZljnpX9EGbvlbJz8vh_h1M3KZvzR0xUWQ7sHGjj4CDWEQZwdoO2BBhR95CT47FoFjjDHLuYz8iOJ_U-wPCMTbB:1wZJMO:9rFBBP189gdmrXHAc_NIckjcoHRrxIAnFs9kdgOn6Ak','2026-06-30 02:17:04.486797'),('hxzwe9lw26jgdoupkwpu5mayx97wkav8','.eJxVjEEOwiAQRe_C2hAGZmjr0r1nIANDbdVAUtqV8e7apAvd_vfef6nA2zqFreUlzKLOCtTpd4ucHrnsQO5cblWnWtZljnpX9EGbvlbJz8vh_h1M3KZvzR0xUWQ7sHGjj4CDWEQZwdoO2BBhR95CT47FoFjjDHLuYz8iOJ_U-wPCMTbB:1wZJ35:8_gwiuHH-Fnc5U2AELUUuC1z6dkHqR5pxY0oFlh_g7M','2026-06-30 01:57:07.498666');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-21 22:14:14
