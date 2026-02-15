import { debug } from "@/utils/debug";
import { createArchiveTimeObserver, setupLiveDisplay } from "./display";
import { addDisplayElements, getVideoTimeElements } from "./dom";
import {
	createInitializationObserver,
	createMicroformatObserver,
} from "./observers";
import { parseYouTubeMicroformat } from "./parser";

// モジュールレベルで状態を管理
// 元の配信時の日時を表示するspan要素（アーカイブ動画用）
const originalBroadcastTimeDisplayElement = document.createElement("span");
// 配信開始時刻を表示するspan要素（ライブ配信用）
const streamStartTimeDisplayElement = document.createElement("span");
// 動画の再生時間変更を監視するオブザーバー
let videoTimeChangeObserver: MutationObserver | null = null;

/**
 * 拡張機能の初期化処理
 * 配信開始時刻を取得するためにmicroformat要素を見つけて監視を開始する
 */
function initializeExtension() {
	debug("🕒💥 拡張機能を初期化します");

	// YouTubeのmicroformat要素の存在確認
	// コンテンツスクリプト注入時点で既に存在している場合がある
	const youTubeMicroformatElement = document.getElementById("microformat");
	if (youTubeMicroformatElement) {
		// microformat要素が既に存在する場合は即座に監視開始
		debug("🕒 microformat要素を見つけました");
		monitorMicroformatChanges(youTubeMicroformatElement);
		return;
	}

	// microformat要素が存在しない場合の動的監視設定
	// YouTubeは非同期でコンテンツを読み込むため、
	// コンテンツスクリプト注入時点ではmicroformat要素がまだ存在しない場合がある
	const observer = createInitializationObserver((microformatNode) => {
		// microformat要素発見後は監視を停止してリソースを節約
		observer.disconnect();
		debug("🕒👀 microformat要素を発見しました /end watch document");
		// 発見したmicroformat要素の継続監視を開始
		monitorMicroformatChanges(microformatNode);
	});

	// document.body配下でYTD-WATCH-FLEXY要素の追加を監視
	// YouTubeの動的読み込みによりmicroformat要素が後から追加されるのを待つ
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
	debug("🕒👀 ドキュメント全体の監視を開始しました");
}

/**
 * YouTubeのmicroformat要素の変更を監視し、
 * 新しいデータが読み込まれた際にリアルタイム表示を更新する
 * @param youTubeMicroformatElement YouTubeのmicroformat要素
 */
async function monitorMicroformatChanges(youTubeMicroformatElement: Element) {
	const observer = createMicroformatObserver(() =>
		setupRealTimeDisplay(youTubeMicroformatElement),
	);
	observer.observe(youTubeMicroformatElement, {
		childList: true,
		subtree: true,
	});
	debug(
		"🕒👀 microformat要素の変更監視を開始しました:",
		youTubeMicroformatElement,
	);

	// 初期実行
	setupRealTimeDisplay(youTubeMicroformatElement);
}

/**
 * YouTube動画のマイクロフォーマットデータを解析し、
 * 配信開始時刻や実際の日時表示を設定する
 * @param microformatElement YouTubeのmicroformat要素
 */
async function setupRealTimeDisplay(microformatElement: Element) {
	debug("🕒💥 リアルタイム表示を設定します");
	clearRealTimeDisplay();
	const { value: microformat, error } =
		parseYouTubeMicroformat(microformatElement);
	debug("🕒 マイクロフォーマットデータを解析しました:", microformat);
	if (error) {
		debug("🕒 マイクロフォーマットの解析でエラーが発生しました:", error);
		return;
	}

	const elements = getVideoTimeElements();
	if (!elements) return;
	debug("🕒 YouTube時間表示要素を見つけました");

	addDisplayElements(
		elements.contents,
		elements.current,
		originalBroadcastTimeDisplayElement,
		streamStartTimeDisplayElement,
	);

	// 通常の動画（ライブ配信ではない）の場合は何もしない
	if (!("publication" in microformat)) {
		debug("🕒 [通常の動画]");
		return;
	}
	const publication = microformat.publication;
	debug("🕒 配信情報を取得しました:", publication);

	const streamStartDate = new Date(publication.startDate);

	// ライブ動画の場合：配信開始時刻のみ表示
	if (!("endDate" in publication)) {
		setupLiveDisplay(streamStartDate, streamStartTimeDisplayElement);
		return;
	}

	// アーカイブ動画の場合：動画の再生時間に基づいて実際の日時を表示
	const streamEndDate = new Date(publication.endDate);
	videoTimeChangeObserver = createArchiveTimeObserver(
		streamStartDate,
		streamEndDate,
		originalBroadcastTimeDisplayElement,
	);
	videoTimeChangeObserver.observe(elements.current, {
		childList: true,
	});
	debug("🕒 [アーカイブ動画] 👀時間変更監視を開始しました", elements.current);
}

/**
 * 時刻表示をリセットし、監視を停止する
 * 新しい動画に切り替わった際などに呼び出される
 */
function clearRealTimeDisplay() {
	originalBroadcastTimeDisplayElement.textContent = "";
	streamStartTimeDisplayElement.textContent = "";
	if (videoTimeChangeObserver) {
		videoTimeChangeObserver.disconnect();
		debug("🕒👀 /end watch currentTime");
	}
}

export function main() {
	initializeExtension();
}
