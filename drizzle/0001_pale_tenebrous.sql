CREATE TABLE `ai_chat_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`message` text NOT NULL,
	`context` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_chat_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('3commas','cryptohopper') NOT NULL,
	`platformBotId` varchar(255) NOT NULL,
	`botName` varchar(255) NOT NULL,
	`status` enum('active','inactive','paused','error') NOT NULL DEFAULT 'inactive',
	`exchange` varchar(100),
	`tradingPair` varchar(50),
	`currentProfit` decimal(18,8) DEFAULT '0',
	`totalProfit` decimal(18,8) DEFAULT '0',
	`winRate` decimal(5,2) DEFAULT '0',
	`totalDeals` int DEFAULT 0,
	`openDeals` int DEFAULT 0,
	`metadata` json,
	`lastUpdatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cryptohopper_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`accountName` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cryptohopper_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`botId` int NOT NULL,
	`platform` enum('3commas','cryptohopper') NOT NULL,
	`platformDealId` varchar(255) NOT NULL,
	`pair` varchar(50) NOT NULL,
	`status` enum('open','closed','cancelled') NOT NULL,
	`entryPrice` decimal(18,8) NOT NULL,
	`exitPrice` decimal(18,8),
	`quantity` decimal(18,8) NOT NULL,
	`profit` decimal(18,8) DEFAULT '0',
	`profitPercent` decimal(5,2) DEFAULT '0',
	`openedAt` timestamp NOT NULL,
	`closedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kraken_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiKey` text NOT NULL,
	`apiSecret` text NOT NULL,
	`accountName` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kraken_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pair` varchar(50) NOT NULL,
	`timeframe` varchar(10) NOT NULL,
	`timestamp` int NOT NULL,
	`open` decimal(18,8) NOT NULL,
	`high` decimal(18,8) NOT NULL,
	`low` decimal(18,8) NOT NULL,
	`close` decimal(18,8) NOT NULL,
	`volume` decimal(18,8) NOT NULL,
	`trades` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deal_completed','loss_threshold','bot_error','market_alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paper_trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`strategyName` varchar(255) NOT NULL,
	`pair` varchar(50) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`initialBalance` decimal(18,8) NOT NULL,
	`finalBalance` decimal(18,8) NOT NULL,
	`profit` decimal(18,8) DEFAULT '0',
	`profitPercent` decimal(5,2) DEFAULT '0',
	`totalTrades` int DEFAULT 0,
	`winningTrades` int DEFAULT 0,
	`winRate` decimal(5,2) DEFAULT '0',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paper_trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `threecommas_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apiKey` text NOT NULL,
	`apiSecret` text NOT NULL,
	`accountName` varchar(255),
	`isActive` int NOT NULL DEFAULT 1,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `threecommas_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('kraken','3commas','cryptohopper') NOT NULL,
	`platformTradeId` varchar(255) NOT NULL,
	`pair` varchar(50) NOT NULL,
	`type` enum('buy','sell') NOT NULL,
	`price` decimal(18,8) NOT NULL,
	`quantity` decimal(18,8) NOT NULL,
	`fee` decimal(18,8) DEFAULT '0',
	`timestamp` timestamp NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` enum('light','dark') NOT NULL DEFAULT 'dark',
	`notificationsEnabled` int NOT NULL DEFAULT 1,
	`emailNotificationsEnabled` int NOT NULL DEFAULT 0,
	`dataRefreshInterval` int NOT NULL DEFAULT 60,
	`dataRetentionDays` int NOT NULL DEFAULT 90,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
