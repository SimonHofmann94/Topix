CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`mime_type` text,
	`file_size` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
