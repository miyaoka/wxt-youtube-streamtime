import { describe, expect, test } from "bun:test";
import { calculateBroadcastDate } from "./display";
import { timeToSec } from "./parser";

describe("calculateBroadcastDate", () => {
	const streamStartDate = new Date("2023-01-01T12:00:00Z");
	const streamEndDate = new Date("2023-01-01T15:00:00Z");

	test("通常表示: 開始から30秒後", () => {
		const result = calculateBroadcastDate(30, streamStartDate, streamEndDate);
		expect(result).toEqual(new Date("2023-01-01T12:00:30Z"));
	});

	test("通常表示: 開始から1時間後", () => {
		const result = calculateBroadcastDate(3600, streamStartDate, streamEndDate);
		expect(result).toEqual(new Date("2023-01-01T13:00:00Z"));
	});

	test("マイナス表示: 終了30秒前", () => {
		const result = calculateBroadcastDate(-30, streamStartDate, streamEndDate);
		expect(result).toEqual(new Date("2023-01-01T14:59:30Z"));
	});

	test("マイナス表示: 終了1時間前", () => {
		const result = calculateBroadcastDate(
			-3600,
			streamStartDate,
			streamEndDate,
		);
		expect(result).toEqual(new Date("2023-01-01T14:00:00Z"));
	});

	test("マイナス表示: 終了2時間前", () => {
		const result = calculateBroadcastDate(
			-7200,
			streamStartDate,
			streamEndDate,
		);
		expect(result).toEqual(new Date("2023-01-01T13:00:00Z"));
	});
});

describe("timeToSec + calculateBroadcastDate 結合テスト", () => {
	const streamStartDate = new Date("2023-01-01T12:00:00Z");
	const streamEndDate = new Date("2023-01-01T15:00:00Z");

	test("YouTube表示 '0:30' → 開始から30秒後", () => {
		const seconds = timeToSec("0:30");
		const result = calculateBroadcastDate(
			seconds,
			streamStartDate,
			streamEndDate,
		);
		expect(result).toEqual(new Date("2023-01-01T12:00:30Z"));
	});

	test("YouTube表示 '-0:30' → 終了30秒前", () => {
		const seconds = timeToSec("-0:30");
		const result = calculateBroadcastDate(
			seconds,
			streamStartDate,
			streamEndDate,
		);
		expect(result).toEqual(new Date("2023-01-01T14:59:30Z"));
	});

	test("YouTube表示 '-1:00:00' → 終了1時間前", () => {
		const seconds = timeToSec("-1:00:00");
		const result = calculateBroadcastDate(
			seconds,
			streamStartDate,
			streamEndDate,
		);
		expect(result).toEqual(new Date("2023-01-01T14:00:00Z"));
	});
});
