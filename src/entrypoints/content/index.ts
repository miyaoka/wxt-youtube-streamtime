import { debug, setDebugMode } from "@/utils/debug";
import { parseYouTubeMicroformat, timeToSec } from "@/utils/microformat";
import { defineContentScript } from "wxt/utils/define-content-script";
import "./style.css";

// 型ガード関数
/**
 * 指定されたノードがElement型かどうかを判定する
 * @param node 判定対象のノード
 * @returns ノードがElement型の場合true、それ以外の場合false
 */
function isElement(node: Node | null | undefined): node is Element {
	return node !== null && node !== undefined && node.nodeType === Node.ELEMENT_NODE;
}

// DOM要素の型定義
interface VideoTimeElements {
	wrapper: HTMLElement;
	current: HTMLElement;
}

// DOM操作関数群
/**
 * YouTube動画プレーヤーの時間表示関連要素を取得する
 * @returns 時間表示要素のオブジェクト。要素が見つからない場合はnull
 */
function getVideoTimeElements(): VideoTimeElements | null {
	const wrapper = document.querySelector<HTMLElement>(".ytp-time-wrapper");
	if (!wrapper) return null;
	
	const current = wrapper.querySelector<HTMLElement>(".ytp-time-current");
	if (!current) return null;
	
	return { wrapper, current };
}

/**
 * 配信時刻表示用のDOM要素をYouTubeプレーヤーに追加する
 * @param wrapper YouTubeの時間表示ラッパー要素
 * @param originalElement アーカイブ動画用の実配信時刻表示要素
 * @param streamElement ライブ配信用の配信開始時刻表示要素
 */
function addDisplayElements(
	wrapper: HTMLElement,
	originalElement: HTMLElement,
	streamElement: HTMLElement
): void {
	if (!document.contains(originalElement)) {
		wrapper.appendChild(originalElement);
		debug("🕒 配信時日時表示要素を追加しました");
	}
	if (!document.contains(streamElement)) {
		wrapper.insertBefore(streamElement, wrapper.firstChild);
		debug("🕒 配信開始時刻表示要素を追加しました");
	}
}

// 時刻表示関数群
/**
 * ライブ配信用の開始時刻表示を設定する
 * @param streamStartDate 配信開始日時
 * @param streamElement 配信開始時刻を表示するHTML要素
 */
function setupLiveDisplay(streamStartDate: Date, streamElement: HTMLElement): void {
	const startTime = streamStartTimeFormatter.format(streamStartDate);
	streamElement.textContent = `${startTime} + `;
	debug("🕒 [ライブ配信中または配信予定]", streamStartDate);
}

/**
 * アーカイブ動画用の時刻変更監視Observerを生成する
 * 再生時間の変更を監視し、実際の配信時刻を計算・表示する
 * @param streamStartDate 配信開始日時
 * @param originalElement 実配信時刻を表示するHTML要素
 * @returns 設定済みのMutationObserver
 */
function createArchiveTimeObserver(
	streamStartDate: Date,
	originalElement: HTMLElement
): MutationObserver {
	return new MutationObserver((mutationsList) => {
		debug("🕒 [アーカイブ動画] 再生時間が変更されました:", mutationsList);
		for (const mutation of mutationsList) {
			const addedNode = mutation.addedNodes[0];
			if (!addedNode) continue;

			const currentVideoTimeInSeconds = timeToSec(
				addedNode.textContent ?? "",
			);
			const originalBroadcastDate = new Date(
				streamStartDate.getTime() + currentVideoTimeInSeconds * 1000,
			);
			const formattedDate = originalBroadcastDateTimeFormatter.format(
				originalBroadcastDate,
			);
			originalElement.textContent = ` ( ${formattedDate} )`;
		}
	});
}

// Observer生成関数群
/**
 * microformat要素内のSCRIPTタグ変更を監視するObserverを生成する
 * YouTubeの動画切り替え時にmicroformatデータが更新された際に処理を実行する
 * @param setupFunction microformatデータ更新時に実行する関数
 * @returns 設定済みのMutationObserver
 */
function createMicroformatObserver(
	setupFunction: () => void
): MutationObserver {
	return new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			const target = mutation.target;
			if (!isElement(target) || target.tagName !== "SCRIPT") continue;
			setupFunction();
		}
	});
}

/**
 * YTD-WATCH-FLEXY要素の追加を監視してmicroformat要素を検出するObserverを生成する
 * YouTubeページの初期読み込み時にmicroformat要素が動的に追加されるのを監視する
 * @param onMicroformatFound microformat要素が見つかった時に実行するコールバック関数
 * @returns 設定済みのMutationObserver
 */
function createInitializationObserver(
	onMicroformatFound: (element: Element) => void
): MutationObserver {
	return new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			const target = mutation.target;
			if (!isElement(target) || target.tagName !== "YTD-WATCH-FLEXY") continue;

			const microformatNode = Array.from(mutation.addedNodes).find(
				(node) => {
					return isElement(node) && node.id === "microformat";
				},
			);
			if (!microformatNode || !isElement(microformatNode)) continue;

			onMicroformatFound(microformatNode);
			return;
		}
	});
}

// 配信開始時刻表示用フォーマッター（例: 20:30:45）
const streamStartTimeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

// 元の配信時の日時表示用フォーマッター（例: 2024/03/15 金 20:30:45）
const originalBroadcastDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	weekday: "short",
});

export default defineContentScript({
	matches: ["*://*.youtube.com/*"],
	main() {
		setDebugMode(true);

		// 元の配信時の日時を表示するspan要素（アーカイブ動画用）
		const originalBroadcastTimeDisplayElement = document.createElement("span");
		// 配信開始時刻を表示するspan要素（ライブ・アーカイブ共通）
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
		async function monitorMicroformatChanges(
			youTubeMicroformatElement: Element,
		) {
			const observer = createMicroformatObserver(() =>
				setupRealTimeDisplay(youTubeMicroformatElement)
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

			addDisplayElements(elements.wrapper, originalBroadcastTimeDisplayElement, streamStartTimeDisplayElement);

			// 通常の動画（ライブ配信ではない）の場合は何もしない
			if (!("publication" in microformat)) {
				debug("🕒 [通常の動画]");
				return;
			}
			const publication = microformat.publication;
			debug("🕒 配信情報を取得しました:", publication);

			const streamStartDate = new Date(publication.startDate);

			// 現在配信中または配信予定の場合：配信開始時刻のみ表示
			if (!("endDate" in publication)) {
				setupLiveDisplay(streamStartDate, streamStartTimeDisplayElement);
				return;
			}

			// アーカイブ動画の場合：動画の再生時間に基づいて実際の日時を表示
			videoTimeChangeObserver = createArchiveTimeObserver(streamStartDate, originalBroadcastTimeDisplayElement);
			videoTimeChangeObserver.observe(elements.current, {
				childList: true,
			});
			debug(
				"🕒 [アーカイブ動画] 👀時間変更監視を開始しました",
				elements.current,
			);
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

		initializeExtension();
	},
});
