/*
 Navicat Premium Data Transfer

 Source Server         : 111.229.156.21
 Source Server Type    : MySQL
 Source Server Version : 80042 (8.0.42-0ubuntu0.22.04.1)
 Source Host           : 111.229.156.21:3306
 Source Schema         : auto_work

 Target Server Type    : MySQL
 Target Server Version : 80042 (8.0.42-0ubuntu0.22.04.1)
 File Encoding         : 65001

 Date: 09/07/2025 13:28:22
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for data_cell
-- ----------------------------
DROP TABLE IF EXISTS `data_cell`;
CREATE TABLE `data_cell`  (
  `id` bigint NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `source_id` bigint NULL DEFAULT NULL,
  `row_index` int NULL DEFAULT NULL,
  `column_index` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `sheet` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `select_index` int NULL DEFAULT NULL,
  `script` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `start_index` int NULL DEFAULT NULL,
  `end_index` int NULL DEFAULT NULL,
  `res` int NULL DEFAULT NULL,
  `template_id` bigint NULL DEFAULT NULL,
  `specific_value` double NULL DEFAULT NULL,
  `type` int NULL DEFAULT NULL,
  `param_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `created_time` timestamp NULL DEFAULT NULL,
  `updated_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files`  (
  `id` bigint NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  `parent_id` bigint NULL DEFAULT NULL,
  `type` int NULL DEFAULT NULL,
  `zip_type` int NULL DEFAULT NULL,
  `template_id` bigint NULL DEFAULT NULL,
  `created_time` timestamp NULL DEFAULT NULL,
  `updated_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for template
-- ----------------------------
DROP TABLE IF EXISTS `template`;
CREATE TABLE `template`  (
  `id` bigint NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `type` int NULL DEFAULT NULL,
  `user_id` bigint NULL DEFAULT NULL,
  `created_time` timestamp NULL DEFAULT NULL,
  `updated_time` timestamp NULL DEFAULT NULL,
  `file_template_id` bigint NULL DEFAULT NULL,
  `data_template_id` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for template_file
-- ----------------------------
DROP TABLE IF EXISTS `template_file`;
CREATE TABLE `template_file`  (
  `id` bigint NOT NULL,
  `template_id` bigint NOT NULL,
  `file_id` bigint NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NULL DEFAULT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `password` varchar(2550) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `enabled` int NULL DEFAULT 1,
  `created_time` timestamp NULL DEFAULT NULL COMMENT '创建时间',
  `updated_time` timestamp NULL DEFAULT NULL COMMENT '更新时间'
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
