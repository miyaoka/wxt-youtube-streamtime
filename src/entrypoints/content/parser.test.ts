import { describe, expect, test } from "bun:test";
import youtubeArchivedHtmlBundle from "./__fixtures__/youtube-archived.html";
import youtubeLiveHtmlBundle from "./__fixtures__/youtube-live.html";
import youtubeNormalHtmlBundle from "./__fixtures__/youtube-normal.html";
import { parseYouTubeMicroformat, timeToSec } from "./parser";

async function loadHtmlContent(bundle: { index: string }): Promise<string> {
	return Bun.file(bundle.index).text();
}

async function getMicroformatElement(bundle: {
	index: string;
}): Promise<Element> {
	const htmlContent = await loadHtmlContent(bundle);
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlContent, "text/html");
	const microformatEl = doc.getElementById("microformat");
	if (!microformatEl) {
		throw new Error("microformat element should exist");
	}
	return microformatEl;
}

describe("timeToSec", () => {
	test("秒のみの時間文字列を正しく変換する", () => {
		expect(timeToSec("45")).toBe(45);
	});

	test("分:秒の時間文字列を正しく変換する", () => {
		expect(timeToSec("1:30")).toBe(90);
		expect(timeToSec("2:05")).toBe(125);
		expect(timeToSec("0:30")).toBe(30);
	});

	test("時:分:秒の時間文字列を正しく変換する", () => {
		expect(timeToSec("1:00:00")).toBe(3600);
		expect(timeToSec("2:05:15")).toBe(7515);
		expect(timeToSec("0:01:30")).toBe(90);
	});

	test("ゼロが含まれる時間文字列を正しく変換する", () => {
		expect(timeToSec("0:00")).toBe(0);
		expect(timeToSec("0:00:00")).toBe(0);
	});

	test("空文字列の場合は0を返す", () => {
		expect(timeToSec("")).toBe(0);
	});

	test("数値でない文字列の場合はNaNを返す", () => {
		expect(timeToSec("abc")).toBeNaN();
	});
});

describe("parseYouTubeMicroformat", () => {
	test("ライブ配信中のマイクロフォーマットを正しく解析する", async () => {
		const microformatEl = await getMicroformatElement(youtubeLiveHtmlBundle);
		const { value, error } = parseYouTubeMicroformat(microformatEl);
		if (error) {
			throw new Error(`Parse failed: ${error.message}`);
		}

		expect(value.name).toBe("Live Stream Test");
		expect(value.description).toBe("Test live streaming video");

		if (!("publication" in value)) {
			throw new Error("publication should exist");
		}
		const publication = value.publication;
		expect(publication.isLiveBroadcast).toBe(true);
		expect(publication.startDate).toBe("2023-01-01T00:00:00Z");
		if ("endDate" in publication) {
			throw new Error("endDate should not exist for live broadcast");
		}
	});

	test("アーカイブ済みライブ配信のマイクロフォーマットを正しく解析する", async () => {
		const microformatEl = await getMicroformatElement(
			youtubeArchivedHtmlBundle,
		);
		const { value, error } = parseYouTubeMicroformat(microformatEl);
		if (error) {
			throw new Error(`Parse failed: ${error.message}`);
		}

		expect(value.name).toBe("Archived Live Stream Test");
		expect(value.description).toBe("Test archived live streaming video");

		if (!("publication" in value)) {
			throw new Error("publication should exist");
		}
		const publication = value.publication;
		expect(publication.isLiveBroadcast).toBe(true);
		expect(publication.startDate).toBe("2023-01-01T00:00:00Z");
		if (!("endDate" in publication)) {
			throw new Error("endDate should exist for archived broadcast");
		}
		expect(publication.endDate).toBe("2023-01-01T01:00:00Z");
	});

	test("通常動画（非ライブ）のマイクロフォーマットを正しく解析する", async () => {
		const microformatEl = await getMicroformatElement(youtubeNormalHtmlBundle);
		const { value, error } = parseYouTubeMicroformat(microformatEl);
		if (error) {
			throw new Error(`Parse failed: ${error.message}`);
		}

		expect(value.name).toBe("Normal Video Test");
		expect(value.description).toBe("Test normal video (not live)");
		if ("publication" in value) {
			throw new Error("publication should not exist for normal video");
		}
	});

	test("scriptタグがない場合はエラーを返す", () => {
		const mockElement = document.createElement("div");
		const { value, error } = parseYouTubeMicroformat(mockElement);
		expect(error).toBeDefined();
		expect(value).toBeUndefined();
	});

	test("scriptタグのtextContentがない場合はエラーを返す", () => {
		const mockElement = document.createElement("div");
		const script = document.createElement("script");
		mockElement.appendChild(script);

		const { value, error } = parseYouTubeMicroformat(mockElement);
		expect(error).toBeDefined();
		expect(value).toBeUndefined();
	});

	test("不正なJSONの場合はエラーを返す", () => {
		const mockElement = document.createElement("div");
		const script = document.createElement("script");
		script.textContent = "{ invalid json }";
		mockElement.appendChild(script);

		const { value, error } = parseYouTubeMicroformat(mockElement);
		expect(error).toBeDefined();
		expect(value).toBeUndefined();
	});
});
