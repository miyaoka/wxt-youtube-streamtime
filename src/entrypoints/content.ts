import { debug, setDebugMode } from "@/utils/debug";
import { parseYouTubeMicroformat, timeToSec } from "@/utils/microformat";
import { defineContentScript } from "wxt/utils/define-content-script";

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

			// YouTubeプレーヤーの時間表示要素を取得
			const videoTimeDisplayWrapper =
				document.querySelector<HTMLElement>(".ytp-time-wrapper");
			if (!videoTimeDisplayWrapper) return;
			const currentVideoTimeElement =
				videoTimeDisplayWrapper.querySelector<HTMLElement>(".ytp-time-current");
			if (!currentVideoTimeElement) return;
			debug("🕒 YouTube時間表示要素を見つけました");

			// 配信時の実際の日時表示要素をDOMに追加
			if (!document.contains(originalBroadcastTimeDisplayElement)) {
				videoTimeDisplayWrapper.appendChild(
					originalBroadcastTimeDisplayElement,
				);
				debug("🕒 配信時日時表示要素を追加しました");
			}
			// 配信開始時刻表示要素をDOMに追加
			if (!document.contains(streamStartTimeDisplayElement)) {
				videoTimeDisplayWrapper.insertBefore(
					streamStartTimeDisplayElement,
					videoTimeDisplayWrapper.firstChild,
				);
				debug("🕒 配信開始時刻表示要素を追加しました");
			}

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
				const startTime = streamStartTimeFormatter.format(streamStartDate);
				streamStartTimeDisplayElement.textContent = `${startTime} + `;
				debug("🕒 [ライブ配信中または配信予定]", streamStartDate);
				return;
			}

			// アーカイブ動画の場合：動画の再生時間に基づいて実際の日時を表示

			// 動画の現在時刻変更を監視し、元の配信時刻を更新
			videoTimeChangeObserver = new MutationObserver((mutationsList) => {
				debug("🕒 [アーカイブ動画] 再生時間が変更されました:", mutationsList);
				for (const mutation of mutationsList) {
					// 時間が更新されると新しいノードが追加される
					const addedNode = mutation.addedNodes[0];
					if (!addedNode) continue;

					// 現在の再生時間から元の配信時刻を計算
					const currentVideoTimeInSeconds = timeToSec(
						addedNode.textContent ?? "",
					);
					const originalBroadcastDate = new Date(
						streamStartDate.getTime() + currentVideoTimeInSeconds * 1000,
					);
					const formattedDate = originalBroadcastDateTimeFormatter.format(
						originalBroadcastDate,
					);
					originalBroadcastTimeDisplayElement.textContent = ` ( ${formattedDate} )`;
				}
			});
			videoTimeChangeObserver.observe(currentVideoTimeElement, {
				childList: true,
			});
			debug(
				"🕒 [アーカイブ動画] 👀時間変更監視を開始しました",
				currentVideoTimeElement,
			);
		}

		/**
		 * YouTubeのmicroformat要素の変更を監視し、
		 * 新しいデータが読み込まれた際にリアルタイム表示を更新する
		 * @param youTubeMicroformatElement YouTubeのmicroformat要素
		 */
		async function monitorMicroformatChanges(
			youTubeMicroformatElement: Element,
		) {
			// script tagの変更を監視
			const observer = new MutationObserver((mutationsList) => {
				for (const mutation of mutationsList) {
					if ((mutation.target as Element).tagName !== "SCRIPT") continue;
					setupRealTimeDisplay(youTubeMicroformatElement);
				}
			});
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
		 * 拡張機能の初期化処理
		 * YouTube動画プレーヤーの時間表示を強制的に表示し、
		 * microformat要素を見つけて監視を開始する
		 */
		function initializeExtension() {
			debug("🕒💥 拡張機能を初期化します");

			// YouTube動画プレーヤーの現在時刻を強制的に表示
			const style = document.createElement("style");
			style.textContent =
				".ytp-time-contents, .ytp-time-current { display: inline !important; }";
			document.documentElement.appendChild(style);

			const youTubeMicroformatElement = document.getElementById("microformat");
			if (youTubeMicroformatElement) {
				debug("🕒 microformat要素を見つけました");
				monitorMicroformatChanges(youTubeMicroformatElement);
				return;
			}

			// bodyのサブツリーでytd-watch-flexyを監視
			const observer = new MutationObserver((mutationsList) => {
				for (const mutation of mutationsList) {
					const target: Element = mutation.target as Element;
					if (target.tagName !== "YTD-WATCH-FLEXY") continue;

					// ytd-watch-flexyにmicroformat要素が含まれている
					const microformatNode = Array.from(mutation.addedNodes).find(
						(node) => {
							return (node as Element).id === "microformat";
						},
					);
					if (!microformatNode) continue;

					// 監視を終了
					observer.disconnect();
					debug("🕒👀 microformat要素を発見しました /end watch document");
					// microformat要素の監視を開始
					monitorMicroformatChanges(microformatNode as Element);
					return;
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});
			debug("🕒👀 ドキュメント全体の監視を開始しました");
		}

		initializeExtension();
	},
});
