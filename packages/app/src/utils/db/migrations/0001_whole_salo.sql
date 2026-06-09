CREATE TABLE `assets` (
	`id` integer PRIMARY KEY NOT NULL,
	`type` text,
	`name` text,
	`path` text,
	`byProjectId` text,
	`byScriptId` text,
	`otherJson` text
);
--> statement-breakpoint
CREATE TABLE `flows` (
	`id` integer PRIMARY KEY NOT NULL,
	`position` text,
	`viewport` text,
	`byProjectId` text,
	`type` text,
	`otherJson` text
);
--> statement-breakpoint
CREATE TABLE `novels` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`group` text,
	`index` text,
	`data` text,
	`event` text,
	`byProjectId` text,
	`otherJson` text
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`createTime` integer,
	`byUser` integer,
	`type` text
);
--> statement-breakpoint
CREATE TABLE `scripts` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`data` text,
	`byProjectId` text,
	`scriptIndex` text,
	`otherJson` text
);
