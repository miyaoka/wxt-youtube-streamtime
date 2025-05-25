import { type Result, tryCatch } from "./result";

// 基本的な共通フィールド
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

// Publication の基本フィールド
interface BasePublication {
	"@type": string;
	isLiveBroadcast: true;
	startDate: string;
}

// ライブ配信中（endDateなし）
interface LiveBroadcast extends BasePublication {}

// アーカイブ済みライブ配信（endDateあり）
interface ArchivedBroadcast extends BasePublication {
	endDate: string;
}

// 各状態のMicroFormat
type LiveStreamMicroFormat = BaseMicroFormat & {
	publication: LiveBroadcast;
};

type ArchivedLiveStreamMicroFormat = BaseMicroFormat & {
	publication: ArchivedBroadcast;
};

type NormalVideoMicroFormat = BaseMicroFormat; // publicationなし

// ユニオン型
export type MicroFormat =
	| LiveStreamMicroFormat
	| ArchivedLiveStreamMicroFormat
	| NormalVideoMicroFormat;

// parse microformat from script tag
export function parseMicroformat(el: Element): Result<MicroFormat, Error> {
	const script = el.querySelector("script");
	const textContent = script?.textContent;

	if (!textContent) {
		return { error: new Error("Script tag or textContent not found") };
	}

	const parseResult = tryCatch(() => JSON.parse(textContent));
	if (parseResult.error) {
		return parseResult;
	}

	const rawData = parseResult.value;

	// JSON-LD仕様ではpublicationは配列として定義されているが、
	// YouTubeの実装では常に1つの要素のみが含まれる。
	// 扱いやすさのため、配列の最初の要素を取り出して単一オブジェクトに変換する。
	if (rawData.publication && Array.isArray(rawData.publication)) {
		rawData.publication = rawData.publication[0];
	}

	return { value: rawData };
}

// Convert timeText to seconds
export function timeToSec(time: string) {
	const [sec, min, hour] = time.split(":").reverse();
	return Number(hour ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(sec ?? 0);
}
