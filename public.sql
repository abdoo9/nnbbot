/*
Navicat PGSQL Data Transfer

Source Server         : whisper
Source Server Version : 100000
Source Host           : localhost:5432
Source Database       : whisper
Source Schema         : public

Target Server Type    : PGSQL
Target Server Version : 100000
File Encoding         : 65001

Date: 2017-10-30 00:55:21
*/


-- ----------------------------
-- Table structure for contacts
-- ----------------------------
DROP TABLE IF EXISTS "public"."contacts";
CREATE TABLE "public"."contacts" (
"user_id" int8 NOT NULL,
"contact_id" int8 NOT NULL,
"created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
)
WITH (OIDS=FALSE)

;

-- ----------------------------
-- Records of contacts
-- ----------------------------

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS "public"."messages";
CREATE TABLE "public"."messages" (
"id" SERIAL,
"sender_id" int8 NOT NULL,
"receiver_id" int8,
"sent_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
"seen" bool DEFAULT true NOT NULL,
"inline_message_id" varchar(32) NOT NULL,
"username" varchar(100) COLLATE "default",
"message" varchar(200) COLLATE "default" NOT NULL
)
WITH (OIDS=FALSE)

;

-- ----------------------------
-- Records of messages
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
"id" SERIAL,
"user_id" int8 NOT NULL,
"lang" char(2) COLLATE "default" NOT NULL,
"first_msg" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
"can_send" bool DEFAULT false NOT NULL,
"name" varchar(255) COLLATE "default",
"username" varchar(255) COLLATE "default"
)
WITH (OIDS=FALSE)

;

-- ----------------------------
-- Records of users
-- ----------------------------

-- ----------------------------
-- Alter Sequences Owned By 
-- ----------------------------

-- ----------------------------
-- Indexes structure for table contacts
-- ----------------------------
CREATE INDEX "c_uid" ON "public"."contacts" USING btree ("user_id");

-- ----------------------------
-- Uniques structure for table contacts
-- ----------------------------
ALTER TABLE "public"."contacts" ADD UNIQUE ("user_id", "contact_id");

-- ----------------------------
-- Indexes structure for table messages
-- ----------------------------
CREATE INDEX "m_s" ON "public"."messages" USING btree ("sender_id");
CREATE INDEX "m_m" ON "public"."messages" USING hash ("inline_message_id");

-- ----------------------------
-- Primary Key structure for table messages
-- ----------------------------
ALTER TABLE "public"."messages" ADD PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "u_uid" ON "public"."users" USING btree ("user_id");

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Key structure for table "public"."contacts"
-- ----------------------------
ALTER TABLE "public"."contacts" ADD FOREIGN KEY ("contact_id") REFERENCES "public"."users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."contacts" ADD FOREIGN KEY ("user_id") REFERENCES "public"."users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Key structure for table "public"."messages"
-- ----------------------------
ALTER TABLE "public"."messages" ADD FOREIGN KEY ("sender_id") REFERENCES "public"."users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
