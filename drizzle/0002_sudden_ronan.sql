CREATE TABLE `advanced_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`orderType` enum('limit','stop_loss','take_profit','trailing_stop','oco') NOT NULL,
	`side` enum('buy','sell') NOT NULL,
	`quantity` decimal(18,8) NOT NULL,
	`entryPrice` decimal(18,8) NOT NULL,
	`limitPrice` decimal(18,8),
	`stopPrice` decimal(18,8),
	`trailingPercent` decimal(5,2),
	`status` enum('pending','active','filled','cancelled','expired') NOT NULL DEFAULT 'pending',
	`exchange` varchar(50) NOT NULL,
	`executedPrice` decimal(18,8),
	`executedQuantity` decimal(18,8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp,
	CONSTRAINT `advanced_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('pending','active','filled','cancelled','expired') NOT NULL,
	`price` decimal(18,8),
	`quantity` decimal(18,8),
	`fee` decimal(18,8),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_history_id` PRIMARY KEY(`id`)
);
