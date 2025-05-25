import { type Result, tryCatch } from "@/utils/result";

/**
 * YouTubeマイクロフォーマットの基本的な共通フィールド
 */
interface BaseMicroFormat {
	"@context": string;
	"@type": string;
	description: string;
	duration: string;
	embedUrl: string;
	interactionCount: string;
	name: string;
	thumbnailUrl: string[];
	uploadDate: string;
	genre: string;
	author: string;
}

/**
 * ライブ配信のpublication基本フィールド
 */
interface BasePublication {
	"@type": string;
	isLiveBroadcast: true;
	startDate: string;
}

/**
 * 現在配信中のライブ配信（endDateなし）
 */
interface LiveBroadcast extends BasePublication {}

/**
 * アーカイブ済みライブ配信（endDateあり）
 */
interface ArchivedBroadcast extends BasePublication {
	endDate: string;
}

/**
 * ライブ配信中の動画のマイクロフォーマット
 */
type LiveStreamMicroFormat = BaseMicroFormat & {
	publication: LiveBroadcast;
};

/**
 * アーカイブ済みライブ配信の動画のマイクロフォーマット
 */
type ArchivedLiveStreamMicroFormat = BaseMicroFormat & {
	publication: ArchivedBroadcast;
};

/**
 * 通常の動画のマイクロフォーマット（publicationなし）
 */
type NormalVideoMicroFormat = BaseMicroFormat;

/**
 * YouTubeのマイクロフォーマットデータの型定義
 * ライブ配信、アーカイブ配信、通常動画のいずれかの形式
 */
export type MicroFormat =
	| LiveStreamMicroFormat
	| ArchivedLiveStreamMicroFormat
	| NormalVideoMicroFormat;

/**
 * YouTubeのmicroformat要素からマイクロフォーマットデータを解析する
 * @param microformatElement YouTubeページのmicroformat要素
 * @returns 解析されたマイクロフォーマットデータまたはエラー
 */
export function parseYouTubeMicroformat(
	microformatElement: Element,
): Result<MicroFormat, Error> {
	const scriptElement = microformatElement.querySelector("script");
	const jsonTextContent = scriptElement?.textContent;

	if (!jsonTextContent) {
		return { error: new Error("Script tag or textContent not found") };
	}

	const jsonParseResult = tryCatch(() => JSON.parse(jsonTextContent));
	if (jsonParseResult.error) {
		return jsonParseResult;
	}

	const parsedMicroformatData = jsonParseResult.value;

	// JSON-LD仕様ではpublicationは配列として定義されているが、
	// YouTubeの実装では常に1つの要素のみが含まれる。
	// 扱いやすさのため、配列の最初の要素を取り出して単一オブジェクトに変換する。
	if (
		parsedMicroformatData.publication &&
		Array.isArray(parsedMicroformatData.publication)
	) {
		parsedMicroformatData.publication = parsedMicroformatData.publication[0];
	}

	return { value: parsedMicroformatData };
}

/**
 * 時間文字列（HH:MM:SS形式）を秒数に変換する
 * @param timeString 時間文字列（例: "1:23:45" または "5:30"）
 * @returns 秒数
 */
export function timeToSec(timeString: string): number {
	const [seconds, minutes, hours] = timeString.split(":").reverse();
	return (
		Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
	);
}
