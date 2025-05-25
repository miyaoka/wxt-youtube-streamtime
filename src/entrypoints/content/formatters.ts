/**
 * 配信開始時刻表示用フォーマッター（例: 20:30:45）
 */
export const streamStartTimeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

/**
 * 元の配信時の日時表示用フォーマッター（例: 2024/03/15 金 20:30:45）
 */
export const originalBroadcastDateTimeFormatter = new Intl.DateTimeFormat(
	undefined,
	{
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		weekday: "short",
	},
);
