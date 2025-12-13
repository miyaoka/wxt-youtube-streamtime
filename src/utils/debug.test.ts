import { describe, expect, spyOn, test } from "bun:test";
import { debug, setDebugMode } from "./debug";

describe("debug", () => {
	test("デバッグモードが有効な場合、コンソールに出力する", () => {
		// console.infoをスパイする
		const consoleSpy = spyOn(console, "info").mockImplementation(() => {});

		setDebugMode(true);
		debug("test message", 123, { key: "value" });

		expect(consoleSpy).toHaveBeenCalledWith("test message", 123, {
			key: "value",
		});

		consoleSpy.mockRestore();
	});

	test("デバッグモードが無効な場合、コンソールに出力しない", () => {
		// console.infoをスパイする
		const consoleSpy = spyOn(console, "info").mockImplementation(() => {});

		setDebugMode(false);
		debug("test message", 123, { key: "value" });

		expect(consoleSpy).not.toHaveBeenCalled();

		consoleSpy.mockRestore();
	});

	test("複数の引数を正しく渡す", () => {
		const consoleSpy = spyOn(console, "info").mockImplementation(() => {});

		setDebugMode(true);
		debug("message1", "message2", 42, true, null, undefined);

		expect(consoleSpy).toHaveBeenCalledWith(
			"message1",
			"message2",
			42,
			true,
			null,
			undefined,
		);

		consoleSpy.mockRestore();
	});

	test("引数なしでも動作する", () => {
		const consoleSpy = spyOn(console, "info").mockImplementation(() => {});

		setDebugMode(true);
		debug();

		expect(consoleSpy).toHaveBeenCalledWith();

		consoleSpy.mockRestore();
	});
});

describe("setDebugMode", () => {
	test("デバッグモードの状態を正しく変更する", () => {
		const consoleSpy = spyOn(console, "info").mockImplementation(() => {});

		// trueに設定
		setDebugMode(true);
		debug("test");
		expect(consoleSpy).toHaveBeenCalledWith("test");

		consoleSpy.mockClear();

		// falseに設定
		setDebugMode(false);
		debug("test");
		expect(consoleSpy).not.toHaveBeenCalled();

		consoleSpy.mockRestore();
	});
});
