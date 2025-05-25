import { isElement } from "@/utils/types";

/**
 * microformat要素内のSCRIPTタグ変更を監視するObserverを生成する
 * YouTubeの動画切り替え時にmicroformatデータが更新された際に処理を実行する
 * @param setupFunction microformatデータ更新時に実行する関数
 * @returns 設定済みのMutationObserver
 */
export function createMicroformatObserver(
	setupFunction: () => void,
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
export function createInitializationObserver(
	onMicroformatFound: (element: Element) => void,
): MutationObserver {
	return new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			const target = mutation.target;
			if (!isElement(target) || target.tagName !== "YTD-WATCH-FLEXY") continue;

			const microformatNode = Array.from(mutation.addedNodes).find((node) => {
				return isElement(node) && node.id === "microformat";
			});
			if (!microformatNode || !isElement(microformatNode)) continue;

			onMicroformatFound(microformatNode);
			return;
		}
	});
}
