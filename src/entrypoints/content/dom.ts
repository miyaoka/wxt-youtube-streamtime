import { debug } from "@/utils/debug";

/**
 * YouTube動画プレーヤーの時間表示関連要素を取得する
 * @returns 時間表示要素のオブジェクト。要素が見つからない場合はnull
 */
export function getVideoTimeElements(): {
	contents: HTMLElement;
	current: HTMLElement;
} | null {
	const contents = document.querySelector<HTMLElement>(".ytp-time-contents");
	if (!contents) return null;

	const current = contents.querySelector<HTMLElement>(".ytp-time-current");
	if (!current) return null;

	return { contents, current };
}

/**
 * 配信時刻表示用のDOM要素をYouTubeプレーヤーに追加する
 * @param contents YouTubeの時間表示ラッパー要素
 * @param current 現在の時間表示要素
 * @param originalElement アーカイブ動画用の実配信時刻表示要素
 * @param streamElement ライブ配信用の配信開始時刻表示要素
 */
export function addDisplayElements(
	contents: HTMLElement,
	current: HTMLElement,
	originalElement: HTMLElement,
	streamElement: HTMLElement,
): void {
	if (!document.contains(originalElement)) {
		contents.appendChild(originalElement);
		debug("🕒 配信時日時表示要素を追加しました");
	}
	if (!document.contains(streamElement)) {
		contents.insertBefore(streamElement, current);
		debug("🕒 配信開始時刻表示要素を追加しました");
	}
}
